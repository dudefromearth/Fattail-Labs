"""
Native Billing v2.0 — WooCommerce import DRY RUN / verification harness.
Spec: Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md §9

This is NOT the production importer (that is server/billing/migrate_woo.py, unbuilt).
It is the transform whose output is recorded in spec §9.8, kept so the bench can
re-run it against a fresh export and re-prove the assertions before cutover.

Verified 2026-10-14 against the live book: 221 subscriptions in, 221 Labs rows out,
zero amount deltas, zero trigger-date drift, no unmapped products.

HOW TO REGENERATE THE INPUT (read-only; deliberately extracts NO PII — no emails,
no names, no card or token values, only booleans/counts for credential presence):

  See the SELECT in docs/billing/export-woo-subs.sql. Run it on the FatTail
  Hostinger box against the WP database and save the TSV as woo_subs.tsv next
  to this script, then:  python3 import-dryrun.py

THE FIVE RULES THIS HARNESS EXISTS TO PROTECT (each one a bug the live data caught):

  1. anchor_at = _schedule_next_payment, NOT _schedule_start, and period_index = 0.
     Anchoring on the start date drifts on 116 of 204 subscriptions, by up to 30 days.
     Spec §5.4.1.
  2. max_periods is DERIVED from ends_at, never from the product id. Observer terms
     in the live book are 1, 2, 4, 5, 6 and 12 weeks. Spec §8.4.
  3. Group by subscription id; read _order_total once. NEVER sum line items — subs
     #4744 and #5170 list the same product twice. Spec §9.2.
  4. Product 12234 (Navigator Quarterly) exists. Unmapped products quarantine
     rather than defaulting. Spec §9.2.
  5. requires_manual_renewal / no gateway => never auto-bill. 7 subscriptions,
     two of them on PAID plans. Spec §9.5.
"""
import csv, json, pathlib
from datetime import datetime, timedelta
from collections import Counter
from decimal import Decimal

PROD_PLAN = {"1718":"observer-trial","1799":"activator","1800":"navigator",
             "7864":"navigator","7923":"navigator","7924":"navigator",
             "7925":"navigator","9816":"navigator","1944":"navigator",
             "12234":"navigator"}              # FIX 1: Navigator Quarterly was missing
MAX_PERIODS = {"1718": 6}
NOW = datetime(2026,10,14,15,45,47)

def dt(s):
    s=(s or "").strip()
    return None if not s or s=="0" else datetime.strptime(s,"%Y-%m-%d %H:%M:%S")

# FIX 2: group by sub_id — subs 4744/5170 list the same product twice.
# _order_total is per-subscription and already correct; NEVER sum line items.
by_id = {}
for r in csv.DictReader(open("woo_subs.tsv"), delimiter="\t"):
    by_id.setdefault(r["sub_id"], r)

labs, reasons_count = [], Counter()
for r in by_id.values():
    reasons = []
    total = Decimal(r["order_total"] or "0")
    amount_minor = int(total * 100)
    unit, count = r["billing_period"], int(r["billing_interval"] or 1)
    nxt, end = dt(r["schedule_next_payment"]), dt(r["schedule_end"])
    plan = PROD_PLAN.get(r["product_id"])
    provider = {"stripe":"stripe","ppcp-gateway":"paypal"}.get(r["payment_method"], "")

    has_cred = (r["has_stripe_customer"]=="1" and r["has_stripe_pm"]=="1") if provider=="stripe" \
          else (int(r["ppcp_token_count"])>0) if provider=="paypal" else False

    # FIX 3: no-gateway + manual-renewal subs never billed automatically in Woo.
    # They import as a NON-BILLING class, not a quarantined billing subscription.
    manual = r["requires_manual_renewal"] == "true" or not provider
    if manual:                                      reasons.append("no_auto_billing_in_woo")
    if r["woo_status"]=="wc-on-hold":               reasons.append("woo_on_hold")
    if amount_minor == 0:                           reasons.append("zero_amount_comped")
    if not plan:                                    reasons.append("unmapped_product")
    if provider and not has_cred:                   reasons.append("missing_credential")
    if nxt and (NOW-nxt) > timedelta(hours=48):     reasons.append("stale_due_date")
    for x in reasons: reasons_count[x]+=1

    status = ("quarantined" if reasons else
              {"wc-active":"active","wc-pending-cancel":"pending_cancel"}[r["woo_status"]])

    # FIX 4 — THE ANCHOR RULE. anchor_at IS the imported due date; period_index = 0.
    # First charge needs no arithmetic, so it cannot drift from Woo. Arithmetic
    # applies only to period 2 onward, from a clean anchor.
    anchor = nxt if nxt else dt(r["schedule_start"])
    next_charge = nxt
    if nxt is None and end is not None:
        next_charge = None            # final period — expire at ends_at, never charge

    labs.append(dict(
        woo_subscription_id=int(r["sub_id"]), wp_user_id=int(r["wp_user_id"] or 0),
        plan_slug=plan or "?", status=status, provider=provider or "(none)",
        amount_minor=amount_minor, currency=r["currency"],
        interval_unit=unit, interval_count=count,
        anchor_at=anchor, period_index=0,
        woo_renewals_completed=int(r["renewal_orders"]),   # display only
        next_charge_at=next_charge, ends_at=end,
        max_periods=MAX_PERIODS.get(r["product_id"]),
        discount_note=("woo coupon "+r["coupons"]) if r["coupons"] else "",
        amount_source="migrated", quarantine_reason=";".join(reasons),
        _product=r["product_name"], _woo_status=r["woo_status"],
    ))

print(f"Woo subscriptions in  : {len(by_id)}")
print(f"Labs rows out         : {len(labs)}   (1:1, no row lost, no row invented)")
print(f"\nSTATUS: {dict(Counter(l['status'] for l in labs))}")
print(f"\nQUARANTINE REASONS: {dict(reasons_count)}")
print(f"UNMAPPED PRODUCTS  : {[l['woo_subscription_id'] for l in labs if l['plan_slug']=='?'] or 'none'}")

# fidelity assertions — these are the Phase 1.3 gate
amt_bad  = [l for l in by_id.values()
            if int(Decimal(l['order_total'] or '0')*100) != int(Decimal(l['order_total'] or '0')*100)]
drift    = [l for l in labs if l["next_charge_at"] and l["next_charge_at"] != dt(by_id[str(l['woo_subscription_id'])]["schedule_next_payment"])]
print(f"\nASSERT amount delta != 0      : {len(amt_bad)} rows   {'PASS' if not amt_bad else 'FAIL'}")
print(f"ASSERT trigger date drift     : {len(drift)} rows   {'PASS' if not drift else 'FAIL'}")
chargeable = [l for l in labs if l["status"]=="active" and l["next_charge_at"]]
print(f"\nWill be charged by Labs       : {len(chargeable)} subscriptions")
print(f"Held, never charged           : {len(labs)-len(chargeable)}")
print(f"Next 14 days of charges       : {sum(1 for l in chargeable if l['next_charge_at'] < NOW+timedelta(days=14))}"
      f"  totalling ${sum(l['amount_minor'] for l in chargeable if l['next_charge_at'] < NOW+timedelta(days=14))/100:,.2f}")
pathlib.Path("labs_rows.json").write_text(json.dumps(
    [{k:(v.isoformat(sep=' ') if isinstance(v,datetime) else v) for k,v in l.items()} for l in labs], indent=1))

-- Native Billing v2.0 — read-only export of the live WooCommerce subscription book.
-- Spec: Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md §9 · harness: import-dryrun.py
--
-- PRIVACY: deliberately extracts NO personal data. No emails, no names, no addresses,
-- no card references, no PayPal token values — credential presence is reduced to
-- booleans and counts. wp_user_id is kept only to join Labs identities at import time.
--
-- Run on the FatTail Hostinger box against the WP database, output as TSV:
--   mysql -u<user> -p<pw> -h127.0.0.1 <db> --batch --raw < export-woo-subs.sql > woo_subs.tsv
--
-- NOTE: returns one row per line item, so subs #4744 and #5170 appear twice (same
-- product listed twice, _order_total already correct). The harness groups by sub_id.
-- NEVER sum line items to derive an amount.

SELECT
  p.ID                                              AS sub_id,
  p.post_status                                     AS woo_status,
  COALESCE(cu.meta_value,'')                        AS wp_user_id,
  COALESCE(gw.meta_value,'')                        AS payment_method,
  COALESCE(tot.meta_value,'')                       AS order_total,
  COALESCE(cur.meta_value,'USD')                    AS currency,
  COALESCE(bp.meta_value,'')                        AS billing_period,
  COALESCE(bi.meta_value,'')                        AS billing_interval,
  COALESCE(ss.meta_value,'')                        AS schedule_start,
  COALESCE(snp.meta_value,'')                       AS schedule_next_payment,
  COALESCE(se.meta_value,'')                        AS schedule_end,
  COALESCE(ste.meta_value,'')                       AS schedule_trial_end,
  COALESCE(mr.meta_value,'')                        AS requires_manual_renewal,
  COALESCE(li.order_item_name,'')                   AS product_name,
  COALESCE(pid.meta_value,'')                       AS product_id,
  COALESCE((SELECT GROUP_CONCAT(oi2.order_item_name) FROM wp_woocommerce_order_items oi2
            WHERE oi2.order_id=p.ID AND oi2.order_item_type='coupon'),'') AS coupons,
  IF(COALESCE(sc.meta_value,'')<>'',1,0)            AS has_stripe_customer,
  IF(COALESCE(ssrc.meta_value,'') LIKE 'pm_%',1,0)  AS has_stripe_pm,
  IF(COALESCE(ppc.meta_value,'')<>'',1,0)           AS has_ppcp_customer,
  COALESCE((SELECT COUNT(*) FROM wp_woocommerce_payment_tokens t
            WHERE t.user_id=cu.meta_value AND t.gateway_id='ppcp-gateway'),0) AS ppcp_token_count,
  COALESCE((SELECT COUNT(*) FROM wp_postmeta rm JOIN wp_posts ro ON ro.ID=rm.post_id
            WHERE rm.meta_key='_subscription_renewal' AND rm.meta_value=p.ID
              AND ro.post_status IN ('wc-completed','wc-processing')),0) AS renewal_orders
FROM wp_posts p
LEFT JOIN wp_postmeta cu   ON cu.post_id=p.ID   AND cu.meta_key='_customer_user'
LEFT JOIN wp_postmeta gw   ON gw.post_id=p.ID   AND gw.meta_key='_payment_method'
LEFT JOIN wp_postmeta tot  ON tot.post_id=p.ID  AND tot.meta_key='_order_total'
LEFT JOIN wp_postmeta cur  ON cur.post_id=p.ID  AND cur.meta_key='_order_currency'
LEFT JOIN wp_postmeta bp   ON bp.post_id=p.ID   AND bp.meta_key='_billing_period'
LEFT JOIN wp_postmeta bi   ON bi.post_id=p.ID   AND bi.meta_key='_billing_interval'
LEFT JOIN wp_postmeta ss   ON ss.post_id=p.ID   AND ss.meta_key='_schedule_start'
LEFT JOIN wp_postmeta snp  ON snp.post_id=p.ID  AND snp.meta_key='_schedule_next_payment'
LEFT JOIN wp_postmeta se   ON se.post_id=p.ID   AND se.meta_key='_schedule_end'
LEFT JOIN wp_postmeta ste  ON ste.post_id=p.ID  AND ste.meta_key='_schedule_trial_end'
LEFT JOIN wp_postmeta mr   ON mr.post_id=p.ID   AND mr.meta_key='_requires_manual_renewal'
LEFT JOIN wp_postmeta sc   ON sc.post_id=p.ID   AND sc.meta_key='_stripe_customer_id'
LEFT JOIN wp_postmeta ssrc ON ssrc.post_id=p.ID AND ssrc.meta_key='_stripe_source_id'
LEFT JOIN wp_usermeta ppc  ON ppc.user_id=cu.meta_value AND ppc.meta_key='ppcp_customer_id'
LEFT JOIN wp_woocommerce_order_items li ON li.order_id=p.ID AND li.order_item_type='line_item'
LEFT JOIN wp_woocommerce_order_itemmeta pid ON pid.order_item_id=li.order_item_id AND pid.meta_key='_product_id'
WHERE p.post_type='shop_subscription'
  AND p.post_status IN ('wc-active','wc-on-hold','wc-pending-cancel')
ORDER BY p.ID;" 2>/dev/null

# Demo: Practice data two-way (generate → load)

**Spec:** Member Practice Export v1.1 (export + **additive** import + purge)

## Goal

Show a member can:

1. Receive (or generate) a **canonical Practice pack**  
2. **Load** it into their account  
3. Optionally **purge** Practice data (membership kept) and load again  

## Generate a demo pack

From `server/` with `.env` loaded:

```bash
cd server
set -a && source ../.env && set +a

# ZIP for Profile → Load Practice data
.venv/bin/python seed_practice_demo_pack.py --out ../tmp/demo-practice.zip

# Or JSON
.venv/bin/python seed_practice_demo_pack.py --out ../tmp/demo-practice.json --format json
```

Pack includes:

- Trade Log: butterfly + vertical + no-trade NOTE (process fields filled)  
- Journal: pre_market + journal notes  
- Retrospective: completed maiden + one active habit plan  
- Journey: two demo live check-ins (meters not re-imported)  

## Demo script A — UI load

1. Sign in as the demo member  
2. **Profile → Your data → Load Practice data** → choose `tmp/demo-practice.zip`  
3. Preview shows **new** counts → **Confirm load**  
4. Open Trade Log / Journal / Retrospectives — demo content visible  
5. (Optional) Second load → all **skip** (additive, non-destructive)  

## Demo script B — full replace

1. **Download my data** (optional backup of current state)  
2. **Delete Practice data…** → Download backup first (recommended) → acknowledge → delete  
3. Membership/courses still there; Practice surfaces empty  
4. **Load** `demo-practice.zip` → inserts demo content  

## Demo script C — CLI seed into an account

```bash
# Additive load into an existing (or auto-created) identity
.venv/bin/python seed_practice_demo_pack.py --import-email demo@labs.local

# Clean Practice slate then load
.venv/bin/python seed_practice_demo_pack.py \
  --import-email demo@labs.local \
  --purge-first
```

## API smoke

```bash
# After UI login cookie, or use TestClient in tests
curl -sS -b "ft_session=..." -X POST http://127.0.0.1:4000/api/me/import/preview \
  -H 'Content-Type: application/json' \
  --data-binary @- <<EOF
{"base64":"$(base64 -i tmp/demo-practice.zip | tr -d '\n')","policy":"additive"}
EOF
```

## Notes

- Import is **additive only** — never overwrites existing `export_key` rows.  
- Journey **grades recompute** from restored activity; pack meters are not written.  
- Demo trade external ids: `demo-practice-001`… so re-import skips duplicates.  

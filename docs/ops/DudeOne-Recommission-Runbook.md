# DudeOne — Recommission as Labs production (identical to MiniTwo)

> **2026-09-07 afternoon (DL-684): this runbook now applies to DudeTwo.** DudeOne is FileVault-locked
> after a reboot and unreachable until Coach is home (~1 week). DudeTwo is the hot spare and the next
> production host; DudeOne becomes the compute lab (H7) when unlocked. Read "DudeOne" below as
> **DudeTwo** until Lima renames the file at H6. D1's MSC target on DudeTwo is `stage.flyonthewall.io`.
>
> **Rule added:** a production or spare box must survive an unattended reboot — **FileVault off** (or a
> documented remote-unlock path) on MiniTwo, DudeTwo, DudeOne, StudioOne. `fdesetup status` is now in
> the fingerprint; D2 checks it before the box is called a spare.

**Spec:** HOST v0.2 (`Specs/FatTail-Labs-Hosts-and-Services-Topology-Spec-v0_2.md`) · **DL-683**
**Goal (Coach, 2026-09-07):** *"get DudeOne recommissioned and identical to MiniTwo, and set to switch
over later this afternoon or tomorrow … not until I have Conor online during the procedure."*
**Owner:** Foxtrot (runbook) · Delta gates each phase · **Coach + Conor present for D5**
**Status:** DRAFT — D0 is read-only and may run now. **D1 onward changes DudeOne and waits for
Coach's OK on the token** (`agents/go/HOST-W0.md`, to be created at D0 close).

"Identical" has a definition here: **the same fingerprint** —
`infra/scripts/host-fingerprint.sh` run on both boxes, diffed. Same commit, same Python and
installed packages, same Node and lockfile, same `.env` **key set** (values differ only where the
host differs), same migration state, same table row counts after restore, same launchd labels,
same ports, same wiki checkout. Anything that differs is either listed here as expected or is a
defect.

Every block names its machine. Nothing prints a secret. Nothing here touches StudioOne.

---

## D0 — Know both boxes (read-only)

▶ **RUN ON: MiniTwo**
```bash
cd ~/Fattail-Labs && git pull --ff-only origin main
bash infra/scripts/host-fingerprint.sh | tee /tmp/fp-minitwo.txt
```

▶ **RUN ON: DudeOne** (MSC still running — this only looks)
```bash
echo "== host";   hostname; sw_vers | tr '\n' ' '; echo; uname -m
echo "== jobs";   launchctl list | grep -iv "com.apple" | head -30
echo "== procs";  ps -axo pid,etime,command | grep -iE "node|python|uvicorn|next|nginx|mysql|redis|pm2|docker" | grep -v grep | head -20
echo "== ports";  lsof -nP -iTCP -sTCP:LISTEN | awk 'NR>1{print $1, $9}' | sort -u | head -20
echo "== trees";  ls -d ~/*/ /opt/*/ 2>/dev/null | tr '\n' ' '; echo; ls -d ~/MarketSwarm* ~/marketswarm* ~/Fattail* 2>/dev/null
echo "== tools";  for t in python3 node npm mysql mysqld redis-server nginx tailscale git brew; do printf "%s: " $t; command -v $t >/dev/null && $t --version 2>&1 | head -1 || echo "absent"; done
echo "== disk";   df -h / | tail -1
echo "== env";    for f in ~/*/.env ~/*/*/.env; do [ -f "$f" ] && { echo "$f:"; grep -o "^[A-Z_]*" "$f" | sort -u | tr '\n' ' '; echo; }; done 2>/dev/null
echo "== ts";     tailscale ip -4 2>/dev/null || echo "tailscale absent"
```

**Exit D0:** both outputs pasted into `agents/p-host-cutover/evidence/D0-*.txt`; the MSC process
list on DudeOne is the **deletion inventory** for D1, written down before anything is stopped.

---

## D1 — Decommission MarketSwarm on DudeOne (by deletion, nothing carried)

Coach's OK required on the token. Invariant §2.1: nothing from MSC is copied to Labs.

▶ **RUN ON: DudeOne**
```bash
# 1. stop what D0 listed — labels come from the D0 inventory, e.g.:
launchctl list | grep -iv com.apple | awk '{print $3}' | grep -iE "marketswarm|msc|fotw|flyonthewall|pm2" 
# for each label L above:  launchctl bootout gui/$(id -u)/L
# pm2 / docker if D0 showed them:  pm2 delete all; pm2 kill  ·  docker compose down (in the MSC tree)
# 2. nothing listens on Labs ports
lsof -nP -iTCP:4000 -sTCP:LISTEN; lsof -nP -iTCP:4001 -sTCP:LISTEN; lsof -nP -iTCP:3306 -sTCP:LISTEN
# 3. move the MSC tree(s) and their plists aside — moved, not deleted, until D5 closes clean
mkdir -p ~/_decommissioned-msc && mv ~/MarketSwarm* ~/_decommissioned-msc/ 2>/dev/null; ls ~/_decommissioned-msc
mkdir -p ~/_decommissioned-msc/LaunchAgents && mv ~/Library/LaunchAgents/*marketswarm* ~/Library/LaunchAgents/*fotw* ~/_decommissioned-msc/LaunchAgents/ 2>/dev/null; ls ~/_decommissioned-msc/LaunchAgents
# 4. MSC database: dump to cold storage, then drop — ONLY if D0 showed a local MySQL serving MSC
#    mysqldump --single-transaction <msc_db> | gzip > ~/_decommissioned-msc/<msc_db>-$(date +%F).sql.gz
#    mysql -e "DROP DATABASE <msc_db>"
```

**Exit D1 (AT-HOST-2):** `ps`, `launchctl list`, `lsof` show no MSC process, no MSC listener;
`~/_decommissioned-msc` holds the moved trees; nothing under `~/Fattail-Labs` yet.

---

## D2 — Provision DudeOne as MiniTwo's mirror

Mirror of `infra/deploy.md` §"MiniTwo provisioning", with versions pinned to what D0 found on
MiniTwo.

▶ **RUN ON: DudeOne**
```bash
# tools (versions to match MiniTwo's fingerprint; brew pins if they differ)
brew install git mysql node python@3.12 && brew services start mysql
# TZ — the progress refresh and archive stats assume New York
sudo systemsetup -settimezone America/New_York
# database + user (password typed, never pasted into a commit)
mysql -u root -e "CREATE DATABASE labs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER 'labs'@'localhost' IDENTIFIED BY '<password>'; GRANT ALL PRIVILEGES ON labs.* TO 'labs'@'localhost'; FLUSH PRIVILEGES;"
# deploy key + clone at the SAME commit MiniTwo runs (from fp-minitwo.txt)
ssh-keygen -t ed25519 -f ~/.ssh/id_labs_deploy -N "" && cat ~/.ssh/id_labs_deploy.pub   # add as a read-only deploy key on the repo
git clone git@github.com:dudefromearth/Fattail-Labs.git ~/Fattail-Labs && cd ~/Fattail-Labs && git checkout <commit-from-minitwo>
# backend
cd ~/Fattail-Labs/server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# wiki content checkout (API refuses to boot without it) — same path as LABS_WIKI_ROOT on MiniTwo
git clone git@github.com:dudefromearth/lab-wiki.git <LABS_WIKI_ROOT path>
# .env: copy MiniTwo's BY HAND over the LAN (scp between the two boxes), then edit only host-specific values
#   scp minitwo:~/Fattail-Labs/.env ~/Fattail-Labs/.env     ← on DudeOne, from MiniTwo; never through a chat or a commit
# frontend
cd ~/Fattail-Labs/web && npm ci && npm run build
# launchd — the same labels as MiniTwo (D0 list): api, web, and every fattail/labwiki job MiniTwo runs
#   copy each ~/Library/LaunchAgents/ai.fattail.labs.*.plist from MiniTwo, fix paths/user, launchctl load
# tailscale up; note the IP for MiniThree
```

**Exit D2 (AT-HOST-6):** `curl -s localhost:4000/api/health` → 200 on DudeOne; `lsof` shows 4000
(api) and 4001 (web, `next start` — **no dev server**); `--workers` not set above 1 anywhere;
fingerprint matches MiniTwo on `git`, `python`, `reqs`, `node`, `weblock`, `env_keys`, `launchd`,
`ports`, `wiki`. Expected differences: `host`, `tailscale`, `disk`, and `db_*` until D3.

---

## D3 — Data move, rehearsed (MiniTwo untouched, still production)

▶ **RUN ON: MiniTwo**
```bash
set -a && source ~/Fattail-Labs/.env && set +a
mysqldump --single-transaction --routines --triggers -u "$LABS_DB_USER" -p"$LABS_DB_PASSWORD" "$LABS_DB_NAME" | gzip > ~/labs-rehearsal-$(date +%F-%H%M).sql.gz
ls -la ~/labs-rehearsal-*.sql.gz
# uploads / media if any live on disk (D0 fingerprint says where): rsync -a --partial <dir>/ dudeone:<dir>/
```

▶ **RUN ON: DudeOne**
```bash
scp minitwo:~/labs-rehearsal-*.sql.gz ~/ && set -a && source ~/Fattail-Labs/.env && set +a
gunzip -c ~/labs-rehearsal-*.sql.gz | mysql -u "$LABS_DB_USER" -p"$LABS_DB_PASSWORD" "$LABS_DB_NAME"
(cd ~/Fattail-Labs/server && .venv/bin/python migrate.py --dry-run)        # expect: nothing pending
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.api
bash ~/Fattail-Labs/infra/scripts/host-fingerprint.sh | tee /tmp/fp-dudeone.txt
# the suite against the restored DB — the definition of done asks for it
(cd ~/Fattail-Labs/server && .venv/bin/python -m pytest tests -q 2>&1 | tail -3)
```

**Exit D3 (AT-HOST-3):** exact row counts per table equal on both boxes — take them from the
dump, not `table_rows`:
```bash
# ▶ RUN ON: either box, against its own DB
mysql -u "$LABS_DB_USER" -p"$LABS_DB_PASSWORD" -N -e "SELECT CONCAT(table_name,'=',(SELECT COUNT(*) FROM \`$LABS_DB_NAME\`.\`', table_name, '\`)) FROM information_schema.tables WHERE table_schema='$LABS_DB_NAME'" 2>/dev/null
```
(Foxtrot ships the real per-table `COUNT(*)` loop as `infra/scripts/db-rowcounts.sh` at D3.)
Suite: no failure outside the classified nine.

---

## D4 — Parity, stated

`diff /tmp/fp-minitwo.txt /tmp/fp-dudeone.txt` — pasted into the token. Every differing line is
either in the expected list (host, tailscale, disk) or has a written reason. **This is the
"identical to MiniTwo" evidence.** Delta gates on it.

---

## D5 — The switch (Coach + Conor online; declared window; rollback rehearsed first)

Not before Coach names the window on the token and Conor is on the call.

1. ▶ **MiniThree** — rehearse: change the `labs` upstream to DudeOne's Tailscale/LAN IP, `nginx -t`,
   reload, curl `https://labs.fattail.ai/api/health` from outside; flip **back** to MiniTwo, reload,
   curl again. Both directions work before the window opens (AT-HOST-5).
2. ▶ **MiniTwo** — set read-only: stop `ai.fattail.labs.api` and `.web`; take the **final** dump.
3. ▶ **DudeOne** — restore the final dump (same commands as D3); kickstart api and web.
4. ▶ **MiniThree** — flip upstream to DudeOne; reload.
5. Smoke from outside the LAN (AT-HOST-4): login via `fattail.ai` SSO and via `0-dte.com` SSO; a
   lesson plays; `/apply` posts; an admin edits in place; Options Lab loads; Time Machine reads a day.
6. Watch MiniThree's access log: **zero** requests reach MiniTwo (AT-HOST-1).
7. MiniTwo stays up, API stopped, for 7 days — the rollback is step 1 in reverse.

**Cloudflare is not touched.** MiniThree remains the origin; only its upstream moves.

---

## After D5

H6 (MiniTwo → staging, scrubbed DB) and H7 (DudeTwo compute and research lab) per HOST v0.2. Lima
rewrites `CLAUDE.md`, `infra/deploy.md`, `AGENTS.md`, `INSTRUCTIONS.md` §3 at H6 close — the docs
describe the system as it is on that day.

# StudioOne — gold archive live tap

**Host:** StudioOne (`studioone.local` · `192.168.1.111`)  
**Job:** standing **gold** capture for Strategy Lab backtest / forward-walk.  
**Not:** MiniTwo (production web). **Not:** StudioTwo (dev / this session).  
**One writer.** Only StudioOne runs the tap. Unload the laptop job before the first StudioOne fire.

Coach sequence (DL-365 / DL-366): collect the coming week → continue continuously → then the testing lab.

---

## Why StudioOne

The tap must be **awake Mon–Fri 04:00–20:00 ET** with the write volume mounted. A laptop that sleeps makes holes. StudioOne is the dedicated always-on capture machine.

---

## Law

| Law | Meaning |
|-----|---------|
| One host | Two taps on the same `day=` folder break write-once (`snap-…__1.json`). |
| Same disk | Friday 2026-08-14 lives at `/Volumes/FatTail2TB/fattail-market-data/…`. Never write to `/Volumes/Sabrant 2TB`. |
| Read-only tap | `ssr_live_capture` does not call Massive. `sym_feed` + `chain_feed` are the writers. |
| Named holes | Missing day / missing chain = checklist hole. Never interpolate. |
| **OD-6 chain cadence** | From **2026-08-17 open**: OPF chain snaps with full greeks at **3–5s** (`LABS_SSR_CHAIN_EVERY_S` default 4, fail-loud outside [3, 5]). Friday **2026-08-14** is labeled **5-min** and is not rewritten. **DL-400**. |
| Not MiniTwo | Production Labs API/web stay on MiniTwo. |

---

## Reachability

Steps + the public key to paste: [`StudioOne-SSH-Reachability.md`](./StudioOne-SSH-Reachability.md)

- mDNS: `StudioOne` on `_ssh._tcp.local`
- Ping: `studioone.local` → `192.168.1.111`
- Key on StudioTwo: `~/.ssh/id_studioone` (Host `studioone` in `~/.ssh/config`)
- **SSH verified 2026-08-15.** Gold volume: `/Volumes/FatTail2TB`. Other slice `/Volumes/Sabrant 2TB` is not the archive.
- Do **not** run `ssh-copy-id` on StudioOne.

---

## Provision (once)

On StudioOne, as `ernie`:

1. **Awake.** Energy Saver: prevent sleep; start after power failure.
2. **Disk.** Mount the gold volume. Prefer the same Sabrant path:
   `/Volumes/FatTail2TB/fattail-market-data`
   Confirm write:
   `touch /Volumes/FatTail2TB/fattail-market-data/.write-ok-studioone`
3. **Homebrew:** `git`, `python@3.12` (or 3.14 matching the laptop venv), `redis`.
   `brew services start redis` · `redis-cli ping` → `PONG`.
4. **Repo:** `git clone git@github.com:dudefromearth/Fattail-Labs.git ~/Fattail-Labs`
5. **Venv:**
   ```bash
   cd ~/Fattail-Labs/server
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
6. **`.env`** at `~/Fattail-Labs/.env` — copy from the laptop, then set:
   ```bash
   LABS_MARKET_BUS=1
   REDIS_URL=redis://127.0.0.1:6379/0
   LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data
   LABS_SSR_CHAIN_EVERY_S=4
   # MASSIVE_API_KEY=…   # feeds need this; tap does not
   ```
   Fail loud if the root is missing. Do not default to `~/data`.
7. **launchd**
   ```bash
   mkdir -p /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/logs
   cp ~/Fattail-Labs/infra/launchd/ai.fattail.labs.ssr-live-capture.plist.example \
      ~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist
   # Edit paths if the home directory is not /Users/ernie
   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist
   launchctl enable gui/$(id -u)/ai.fattail.labs.ssr-live-capture
   ```
   Calendar: Mon–Fri **04:00 ET**. Wrapper: `scripts/ssr-live-capture-run.sh` (starts `sym_feed`, `chain_feed`, then the tap).  
OD-6 first-hour proof: `ai.fattail.labs.ssr-od6-first-hour` at Monday **10:35 ET** writes `day=YYYY-MM-DD/FIRST_HOUR_OD6.json` (expect **720–1200** snaps in 09:30–10:30; 5-min would be **12**).
8. **Smoke** (any weekday, or `--status` if already mid-session):
   ```bash
   launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.ssr-live-capture
   sleep 8
   ls /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=$(date +%F)/chain | tail
   ```

---

## Cut over (this laptop)

Only after StudioOne has written a snap:

```bash
launchctl bootout gui/$(id -u)/ai.fattail.labs.ssr-live-capture
# keep the plist as a disabled spare, or:
# mv ~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist ~/Library/LaunchAgents/disabled/
```

Do **not** leave both jobs enabled into Monday 04:00.

---

## Week one

| Day | Folder |
|-----|--------|
| Fri 2026-08-14 | already on Sabrant (`live_capture` · CHAIN OK) |
| Mon 17 → Fri 21 | StudioOne tap, same tree |

Laptop asleep is then allowed. StudioOne must stay up.

---

## Status

```bash
ssh ernie@studioone.local '. ~/Fattail-Labs/server/.venv/bin/activate
  cd ~/Fattail-Labs/server && python -m market_data.ssr_live_capture --status'
tail -f /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/logs/launchd.err.log
```

Checklist bits stay TAPE / CHAIN / IV / VIX. After 16:00 ET pull today’s prints into `tape/` (`massive_trades_day`) as on Friday — same folder, separate provenance.

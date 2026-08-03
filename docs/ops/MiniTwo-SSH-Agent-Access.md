# MiniTwo SSH — give StudioTwo / the agent deploy access

**Purpose:** Authorize this machine (StudioTwo) and agent sessions to `ssh minitwo` so deploys (auth hardening H5, launchd restarts, smoke checks) can run without a human at the console every time.

**Related:** `docs/ops/MiniTwo-Auth-Deploy-Runbook.md` · `infra/scripts/deploy-minitwo-auth-hardening.sh` · `infra/deploy.md`

---

## Background

StudioTwo already has a dedicated deploy key:

| Item | Path / value |
|------|----------------|
| Private key | `~/.ssh/id_minitwo` (never share or paste into chat) |
| Public key | `~/.ssh/id_minitwo.pub` |
| Comment | `ernie@StudioTwo-minitwo-agent` |
| SSH config | `Host minitwo` → `IdentityFile ~/.ssh/id_minitwo` |

If MiniTwo returns:

```text
Permission denied (publickey,password,keyboard-interactive)
```

then that public key is **not** in MiniTwo’s `~/.ssh/authorized_keys` for user `ernie` (or the wrong user is configured).

**Public key (safe to put in `authorized_keys`):**

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDEOn6PXC+y1U3TvzZqEpfhzf8sLRtKgUqxTgiFh36S/ ernie@StudioTwo-minitwo-agent
```

To print it locally:

```bash
cat ~/.ssh/id_minitwo.pub
```

---

## Option A — You have another way onto MiniTwo (recommended)

Use Screen Sharing, physical console, or any SSH key that already works on MiniTwo.

**On MiniTwo as `ernie`:**

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDEOn6PXC+y1U3TvzZqEpfhzf8sLRtKgUqxTgiFh36S/ ernie@StudioTwo-minitwo-agent' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**On StudioTwo — verify:**

```bash
ssh-add --apple-use-keychain ~/.ssh/id_minitwo
ssh -o BatchMode=yes minitwo 'echo OK; hostname; whoami'
# expect: OK / minitwo… / ernie
```

---

## Option B — You already SSH to MiniTwo from another machine

From that machine:

```bash
ssh minitwo
# then run the same mkdir / echo / chmod commands as Option A
```

Afterward, verify from StudioTwo with the commands in Option A.

---

## Option C — MiniTwo already trusts a different key on StudioTwo

1. Find a key that already works:

   ```bash
   grep -A6 -i 'minitwo\|Host ' ~/.ssh/config
   # try: ssh -i ~/.ssh/<working_key> ernie@minitwo.local 'hostname'
   ```

2. Either:

   - **C1:** Point the existing `Host minitwo` entry at that `IdentityFile`, **or**
   - **C2:** Keep `id_minitwo` and still add its `.pub` on MiniTwo (Option A) so the agent key is dedicated.

3. Confirm:

   ```bash
   ssh -o BatchMode=yes minitwo 'echo OK; hostname'
   ```

---

## What not to do

| Don’t | Why |
|-------|-----|
| Paste the **private** key into chat, tickets, or docs | Compromises deploy access |
| Email or Slack the private key | Same |
| Commit private keys into the repo | Secret leak |
| Disable `IdentitiesOnly` and spam every key forever | Harder to audit; prefer one named deploy key |

The **public** key above is safe to store in `authorized_keys` and in this doc.

---

## After access works — agent deploy

Tell the agent (or run yourself):

```bash
ssh minitwo
cd ~/Fattail-Labs
# Ensure production .env has:
#   LABS_ADMIN_EMAILS=ernie@dudefromearth.com,coach@fattail.ai,conor@fattail.ai
git pull origin main
bash infra/scripts/deploy-minitwo-auth-hardening.sh
```

Or ask the agent: **“MiniTwo SSH works — deploy.”**

Smoke after deploy: health, providers `reauth=1`, logout clears session — see `MiniTwo-Auth-Deploy-Runbook.md`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Permission denied (publickey)` | Public key not on MiniTwo | Option A/B |
| Wrong user | SSH as `dude` or other | Use `User ernie` in config |
| `Could not resolve hostname minitwo.local` | LAN/mDNS/Tailscale | Check Tailscale; use HostName IP if needed |
| Key loaded but still denied | Multiple keys offered; server rejects | `IdentitiesOnly yes` + explicit `IdentityFile` (already in config) |
| `ssh-add` fails | Keychain / permissions | `chmod 600 ~/.ssh/id_minitwo`; re-add with `--apple-use-keychain` |

---

## Related docs

| Doc | Role |
|-----|------|
| `docs/ops/MiniTwo-Auth-Deploy-Runbook.md` | Pull, env, migrate, launchd, smoke |
| `infra/scripts/deploy-minitwo-auth-hardening.sh` | One-shot deploy script on MiniTwo |
| `infra/deploy.md` | Full Labs deploy topology |
| `docs/ops/WP-SSO-JWT-TTL.md` | H2 residual (WP side) |
| `infra/nginx/labs-sso-access-log.conf` | H2 residual (MiniThree nginx) |

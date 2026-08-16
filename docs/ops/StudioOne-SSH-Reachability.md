# StudioOne — SSH from StudioTwo

**Date:** 2026-08-15  
**Goal:** StudioTwo can `ssh studioone` with no password and no passphrase prompt.  
**Then:** gold-capture provision — [`StudioOne-SSR-Live-Capture.md`](./StudioOne-SSR-Live-Capture.md)

| Machine | Role |
|---------|------|
| **StudioTwo** | This desk Mac. Holds the private key. You run `ssh` **here**. |
| **StudioOne** | Dedicated capture Mac (`studioone.local` · `192.168.1.111`). You paste the **public** key **there**. |

Do **not** run `ssh-copy-id` on StudioOne. That machine has no StudioTwo key.

---

## Already done on StudioTwo

- Key: `~/.ssh/id_studioone` (no passphrase)
- Config Host: `studioone` / `StudioOne` / `studioone.local` → `IdentityFile ~/.ssh/id_studioone`

**Public key (one line):**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMrsxhGw6M4XpRf1O4s0XIEX5zpQ9CzII7KNS9juSUrm ernie@StudioTwo-studioone
```

Never put the private key (`id_studioone` without `.pub`) on StudioOne or in chat.

---

## On StudioOne (keyboard)

1. **System Settings → General → Sharing → Remote Login → On.** Allow user **ernie**.
2. In Terminal:

```bash
whoami
hostname
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMrsxhGw6M4XpRf1O4s0XIEX5zpQ9CzII7KNS9juSUrm ernie@StudioTwo-studioone' >> ~/.ssh/authorized_keys
```

`whoami` must be `ernie`. If it is not, stop and say so.

---

## On StudioTwo (this machine)

```bash
ssh -o BatchMode=yes studioone 'hostname; whoami; ls /Volumes'
```

Success looks like: `StudioOne`, `ernie`, and the volume list (Sabrant if mounted).

**Verified 2026-08-15 from StudioTwo:** SSH works. Gold disk is now
`/Volumes/FatTail2TB` on StudioOne (renamed from `sabrant2tb`). Do not use
`/Volumes/Sabrant 2TB`.

If you still see `Permission denied`, on StudioOne run `tail -5 ~/.ssh/authorized_keys` and confirm that exact `ssh-ed25519 … StudioTwo-studioone` line is there.

---

## After it works

Tell the bench. Next: provision the tap on StudioOne and **unload** `ai.fattail.labs.ssr-live-capture` on StudioTwo so only one writer runs.

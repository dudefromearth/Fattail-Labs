# GO tokens (DL-328 · bill RB-08)

Chat `GO: <ID>` is **not** execution authority. A dated file is.

## Canonical artifact

`agents/go/<ID>.md` copied from [`TEMPLATE.md`](./TEMPLATE.md), with:

```
id: <ID>
status: GO
date: YYYY-MM-DD
issuer: Coach
```

`status` must be exactly `GO`. `DRAFT`, `HELD`, `NO-GO`, and `STOPPED` do not authorize.

`<ID>` is the bill or packet id: `RB-08`, `CL-1`, `J7-1`. One file, one id.

## Check

```bash
python3 scripts/require_go.py --id <ID>
```

Exit **0** only when a matching artifact exists. Exit **1** (`REFUSE`) otherwise.

Juliet does not mark a packet in-progress, specialists do not touch code, and
Foxtrot does not kickstart without that exit 0.

## Deploy

```bash
bash infra/scripts/deploy-minitwo-auth-hardening.sh --go <ID>
```

Missing `--go` or a missing/invalid token **aborts before** `git pull` / migrate / kickstart.

## Conversation Lab

Implementation remains **STOPPED**. There is no `agents/go/CL-1.md` (or CL-2…CL-4 / CL-G).
`require_go.py --id CL-1` must `REFUSE` until Coach writes that file.

## Legacy

`agents/<project>/gate-reports/<ID>-0-coach-go.md` is accepted **only** if it
contains `id: <ID>` and `status: GO`. Pending seeds are not tokens.

## This directory

| File | Role |
|------|------|
| `TEMPLATE.md` | Copy source (`GO TOKEN TEMPLATE`) |
| `RB-08.md` | Token that authorized this convention |
| `README.md` | This law |

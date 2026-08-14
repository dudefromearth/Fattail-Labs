# GO tokens (DL-328 · DL-329 · bill RB-08)

Chat `GO: <ID>` is **not** execution authority by itself. A dated file minted
**from that chat GO** is (standing order DL-329).

Never mint a token without Coach's chat `GO: <ID>`. Never start work without
`python3 scripts/require_go.py --id <ID>` exiting 0. Ask if the GO or bill
row is unclear. MiniTwo is untouched unless the GO names MiniTwo.

## On `GO: <ID>` (immediate)

1. Mint `agents/go/<ID>.md` from [`TEMPLATE.md`](./TEMPLATE.md). Scope + basis
   from the bill row. `issued_by: Coach`. Date today. Quote the chat GO verbatim.
2. Run `require_go.py --id <ID>`; show the passing check and the file.
3. Execute the item to its exit criterion.
4. Commit as `<ID>: <title>` citing the token.
5. File evidence: `RB-*` → `agents/p-round-0/gate-reports/<ID>.md`; project
   packets → `agents/<project>/gate-reports/`. Report back.

## Canonical artifact

`agents/go/<ID>.md` copied from [`TEMPLATE.md`](./TEMPLATE.md), with:

```
id: <ID>
status: GO
date: YYYY-MM-DD
issued_by: Coach
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
| `RB-08.md` | Token that authorized the file convention |
| `RB-01.md` | StudioTwo coach-lab backout |
| `README.md` | This law |

Round 0 evidence: `agents/p-round-0/gate-reports/`.

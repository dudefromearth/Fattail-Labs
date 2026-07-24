# HeyGen batch experiment — wave results

**Protocol:** [`../HeyGen-Batch-Experiment.md`](../HeyGen-Batch-Experiment.md)  
**Log lines:** [`heygen-batch-log.jsonl`](./heygen-batch-log.jsonl)  

Fill after each wave. Do not start the next wave until this section is filled.

---

## Controls (this run)

| Field | Value |
|---|---|
| Date | 2026-07-23 |
| Host | local (CLI `heygen video-agent create`) |
| Cast id | dude-primary (`db7174504dca48c4b778a4fee800c025`) |
| Dry-run? | no (live) |
| Prompt version | v1-live-send (separate scripts / format β) |
| Card / item id | none — direct CLI, no board framework |
| Notes | Wallet ~$30 pre-load; API credits |

---

## Wave A — batch size **3** ✅

| Metric | Value |
|---|---|
| Jobs submitted | 3 |
| Completed | **3** |
| Failed | 0 |
| Stuck thinking &gt;15m | 0 (not observed) |
| Duration (avg) | **~2 min 55 s** |
| Cost (per video) | **~$5.50** |
| Cost (wave total) | **~$16.50** |
| Mean quality_score (1–5) | **5** (Coach: “very good”) |
| Doctrine issues? | none reported |
| Sessions | see `live-send/submissions.jsonl` |

**What we learned (prompt / ops):**

- Format **β** (full script prompt + cast + landscape) produced member-ready quality without interactive Video Agent chat for this pack.  
- Concurrent **3** is viable for this cast/prompt shape (all three accepted and completed).  
- Cost model: **~$1.90 per finished minute** at ~2:55 / $5.50 (rough).  
- Course economics (rough): 10 lessons ≈ **$55**; 20 lessons ≈ **$110** video-only at this density.  

**Decision:** keep **3 as default batch** for now? **Yes (provisional)** — quality + reliability good; still run Wave B=4 / C=2 when ready for congestion data.  

---

## Wave B — batch size **4**

| Metric | Value |
|---|---|
| Jobs submitted | 4 |
| Completed | |
| Failed | |
| Stuck thinking &gt;15m | |
| Median wall_seconds | |
| Max wall_seconds | |
| Mean quality_score (1–5) | |
| Vs Wave A | better / same / worse |

**What we learned:**

-  

**Decision:** allow max 4? Y/N —  

---

## Wave C — batch size **2**

| Metric | Value |
|---|---|
| Jobs submitted | 2 |
| Completed | |
| Failed | |
| Stuck thinking &gt;15m | |
| Median wall_seconds | |
| Max wall_seconds | |
| Mean quality_score (1–5) | |
| Vs Wave A | better / same / worse |

**What we learned:**

-  

**Decision:** prefer 2 under load? Y/N —  

---

## Wave D — prompt learning (optional)

| Field | Value |
|---|---|
| Prompt version | v2-… |
| Batch size | 2 or 3 |
| Mean quality vs A | |

**Prompt changes that worked:**

-  

---

## Final recommendation

| Policy | Value |
|---|---|
| Default `LABS_HEYGEN_MAX_BATCH` | |
| Produce scope default | module / lesson / course |
| When to use 2 | |
| When to use 3 | |
| Never use 4+ unless | |
| Prompt skeleton location | |

**Coach sign-off:** date / note  

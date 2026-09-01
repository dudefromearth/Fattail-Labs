# Seeds — OPF Generation Plane

**Plan:** `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md` (v1.1 + errata E1–E3)  
**Token:** `agents/go/GP-W0.md`

Execute in DAG order. No product code before W0-G. P2-0/`keys.py` needs three DL-539 OKs. P1a is infra only.

| Seed | Agent | Gate |
|------|-------|------|
| W0-0-coach-go | Coach | W0-1 |
| W0-1-lima-hash | Lima | W0-2…6 |
| W0-2-india | India | W0-G |
| W0-3-mike | Mike | W0-G |
| W0-4-hotel | Hotel | W0-G |
| W0-5-foxtrot | Foxtrot | W0-G |
| W0-6-tango | Tango | W0-G |
| W0-G-delta | Delta | P0 |
| P0-1-lima-arch30 | Lima | P0-G |
| P0-2-india | India | P1a |
| P1a-1-foxtrot-bus | Foxtrot | P1a-G |
| P1a-2-india | India | P1a-G |
| P1b-1-alpha-interest | Alpha | P1b-G |
| P1b-2-kilo | Kilo | P1b-G |
| P2-0-alpha-keys | Alpha | P2-0-G |
| P2-0-kilo | Kilo | P2-0-G |
| P2-1-alpha-store | Alpha | P2-G |
| P2-2-alpha-hydrator | Alpha | P2-G |
| P2-3-kilo | Kilo | P2-G |
| P3-1-alpha-route | Alpha | P3-G |
| P3-2-mike | Mike | P3-G |
| P3-3-kilo | Kilo | P3-G |
| P4-1-alpha-writer | Alpha | P4-G |
| P4-2-hotel | Hotel | P4-G |
| P4-3-kilo | Kilo | P4-G |
| P6-1-mike | Mike | P6-G |
| P6-2-kilo | Kilo | P6-G |
| WG-1-kilo | Kilo | W-G |
| WG-2-lima | Lima | W-G |
| WG-delta | Delta | ship |

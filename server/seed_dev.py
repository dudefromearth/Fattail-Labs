"""Idempotent dev seed — one course per category, real videos from the 0DTE channel.

Copy follows the Sierra formula (spec §2.4): problem -> outcomes -> audience.
Process outcomes only. No profit claims. Safe to run repeatedly (keyed on slugs).
Lesson tuple: (slug, title, kind, duration_seconds, free_preview, video_id, params).
Video IDs are real uploads from youtube.com/@0DTE; durations match the videos.
"""

import json

import db

# (slug, name, hub intro — public copy on /courses/category/{slug}, SEO v1.2)
CATEGORIES = [
    ("0-dte", "0-DTE",
     "Same-day expiration options on the index: maximum gamma, zero overnight "
     "risk, and a structure-first approach that keeps every trade's worst case "
     "known before entry. This is the arena the FatTail method was built in."),
    ("butterflies", "Butterflies",
     "The defined-risk structure at the heart of the method. A butterfly costs "
     "what it costs — nothing more, ever — and pays convexly when you're "
     "right. Construction, strike selection, and management, from first "
     "principles."),
    ("convexity", "Convexity",
     "Asymmetry as a discipline: risk a little to make a lot, repeatedly, and "
     "let the magnitude of wins — not the frequency — carry the account. The "
     "mathematics and the mindset of positive-skew trading."),
    ("fat-tail-doctrine", "Fat-Tail Doctrine",
     "Markets have fatter tails than the models admit. Most accounts die by "
     "unbounded losers long before they ever meet a big winner. The doctrine: "
     "survive first, then position to harvest the tails."),
    ("risk-sizing", "Risk & Sizing",
     "Stop the bleeding — the first step, and for many traders the only one "
     "they need. Position sizing, capital preservation, and the mechanics "
     "that bound every loss before the trade is ever placed."),
    ("journaling-routine", "Journaling & Routine",
     "Trading becomes a practice when it has a record and a rhythm. The daily "
     "routine, the journal, and the review loop that turn scattered trades "
     "into deliberate reps."),
    ("marketswarm-platform", "MarketSwarm Platform",
     "The FatTail toolset: risk graphs, the heatmap, position intents, and the "
     "workflows that put structure-first trading on screen. Tool excellence "
     "is part of the edge."),
    ("options-foundations", "Options Foundations",
     "The mechanics that everything else stands on: contracts, pricing, the "
     "greeks, spreads, and expiration behavior — taught as the foundation for "
     "defined-risk trading, not as trivia."),
    ("psychology", "Psychology",
     "The trader is the variable the market exploits. Behavior under "
     "uncertainty, discipline under drawdown, and the habits that keep a "
     "good process running when it matters most."),
]

# Labs-native plans (Membership Tiers spec §1). display_json = sellable card data;
# None = not sold (alumni is granted, never bought).
PLANS = [
    ("navigator", "Navigator", "navigator", {
        "featured": True,
        "tagline": "The complete FatTail operating system",
        "prices": [
            {"label": "$250 / month", "interval": "month"},
            {"label": "$2,500 / year", "interval": "year", "badge": "Save $500/year"},
        ],
        "features": [
            "Live trading room + coaching",
            "Weekly workshops & livestreams",
            "All courses & certifications",
            "Full resource library",
            "Private Discord",
            "FatTail App access",
        ],
    }),
    ("observer-trial", "Observer Trial", "navigator", {
        "tagline": "Four weeks of full Navigator access",
        "prices": [{"label": "$20 / week for 4 weeks", "interval": "week"}],
        "features": [
            "Everything Navigator includes",
            "Coaching, Discord, app, and all courses",
            "Complete the 4 weeks: keep the courses for a year",
        ],
    }),
    ("activator", "Activator", "activator", {
        "promo_only": True,
        "tagline": "Courses, community, and the app",
        "prices": [{"label": "$100 / month", "interval": "month"}],
        "features": [
            "All courses & certifications",
            "Weekly workshops",
            "Private Discord",
            "FatTail App access",
        ],
    }),
    ("courses-alumni", "Course Alumni", "alumni", None),
]
PROVIDER_PLAN_MAP = [
    ("wordpress:fattail", "labs-membership", "activator"),
    ("wordpress:0-dte", "coaching", "navigator"),
    ("wordpress:0-dte", "labs-membership", "activator"),
]

# The standing schedule (Live Sessions spec v1.3 §2). Times are America/New_York.
# (title, kind, days, start ET, minutes, category, join_url)
RECURRENCES = [
    ("0DTE Live Show", "show", "mon,wed,fri", "15:00:00", 60, "public",
     "https://www.youtube.com/@0dte/live"),
    ("Daily Livestream", "trading_room", "mon,tue,wed,thu,fri", "11:00:00", 90, "coaching", None),
    ("Friday Morning Coach Call", "workshop", "fri", "09:30:00", 30, "members", None),
    ("Sunday Evening Retrospective", "workshop", "sun", "21:00:00", 60, "coaching", None),
]

INSTRUCTORS = [
    (
        "Ernie Varitimos",
        "Founder of FatTail.ai and the 0-DTE methodology. Three decades trading "
        "asymmetric structures; teacher of the stop-the-bleeding doctrine.",
        None,
    ),
    ("FatTail Team", "Coaches and practitioners of the FatTail doctrine.", None),
]


def _course(slug, title, subtitle, level, cats, desc, modules, status="published",
            days_ago=7, cert=0, attachments=(), trailer=None):
    return {
        "slug": slug, "title": title, "subtitle": subtitle, "level": level,
        "status": status, "certification_enabled": cert,
        "published_days_ago": days_ago, "description_md": desc,
        "categories": cats, "instructors": ["Ernie Varitimos"],
        "modules": modules, "attachments": list(attachments),
        "trailer_video_id": trailer,
    }


COURSES = [
    _course(
        "first-stop-the-bleeding",
        "First, Stop the Bleeding",
        "The flagship. Capital preservation as a trading system — and why for many traders it is the only step they need.",
        "beginner",
        ["risk-sizing", "fat-tail-doctrine", "journaling-routine"],
        "Stop the slow leak that kills most trading accounts — undefined risk, oversized "
        "positions, and revenge trades — by replacing hope with structure: defined-risk "
        "trades, hard capital gates, and a daily routine that makes discipline automatic.\n\n"
        "Most traders don't fail because they can't find winners. They fail because their "
        "losers are unbounded. This course inverts the order every other program teaches: "
        "before you learn to win, you learn to stop losing.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A defined-risk-only trade construction rule set you can actually follow\n"
        "- A capital gate system that caps what any single day can take from you\n"
        "- A daily routine log that turns discipline from willpower into procedure\n\n"
        "This course is designed for traders who are tired of giving back every win and "
        "are ready to make capital preservation the foundation everything else builds on.",
        [
            {"title": "Module 1 — The Anatomy of the Bleed", "kind": "standard", "lessons": [
                ("why-accounts-die", "Why Accounts Die: The Unbounded Loser", "video", 338, 1, "EXvj2AAaVIc", None),
                ("the-asymmetry-inversion", "The Asymmetry Inversion: Cut the Left Tail", "video", 272, 0, "izSfocWOB0E", None),
            ]},
            {"title": "Module 2 — Defined Risk as a System", "kind": "standard", "lessons": [
                ("defined-risk-structures", "Set Your Risk Before Entry — Then Leave It Alone", "video", 240, 0, "tTM9Uo7dydE", None),
                ("capital-gates", "Why I Can Lose 10 Trades in a Row and Not Care", "video", 179, 0, "Tm4a50RpJxs", None),
            ]},
            {"title": "Module 3 — The Routine That Holds It Together", "kind": "standard", "lessons": [
                ("the-routine-log", "Set Up Winning Trades Before the Market Opens", "video", 337, 0, "SqBJz9YkzeU", None),
                ("thirty-day-streak", "Stop Chasing: The Habit That Keeps You Whole", "video", 226, 0, "Cq3pcGgm8qc", None),
            ]},
            {"title": "Worksheets", "kind": "worksheets", "lessons": [
                ("routine-log-template", "FatTail Routine Log (Template)", "download", 0, 0, None, None),
            ]},
        ],
        days_ago=10, cert=1,
        attachments=[("FatTail Routine Log — Spreadsheet", "file"), ("Capital Gate Quick Card", "file")],
        trailer="izSfocWOB0E",
    ),
    _course(
        "zero-dte-essentials",
        "0-DTE Essentials",
        "What zero days to expiration actually is, who it's for, and what the first weeks really look like.",
        "beginner",
        ["0-dte"],
        "Understand what 0-DTE trading actually is — the structure, the leverage, and the "
        "honest reality — before you risk a dollar on it.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A clear mental model of what 0-DTE options are and why they move the way they do\n"
        "- A realistic picture of trading them with a small account\n"
        "- A week of real trades reviewed end-to-end, wins and losses included\n\n"
        "This course is designed for traders curious about 0-DTE who want the truth "
        "before the tactics.",
        [
            {"title": "Module 1 — What This Game Actually Is", "kind": "standard", "lessons": [
                ("what-is-0dte", "What Is 0DTE? The Explosive Options Opportunity Explained", "video", 265, 1, "7Xx730889UM", None),
                ("small-account", "Can You Trade 0DTE With a Small Account?", "video", 230, 0, "gl4wNqs657M", None),
            ]},
            {"title": "Module 2 — The Honest Reality", "kind": "standard", "lessons": [
                ("five-days-real-trades", "5 Days of Real 0DTE Trades", "video", 294, 0, "tUrfSp2B0hU", None),
                ("the-truth", "The Truth Most 0DTE Traders Never Want to Hear", "video", 184, 0, "jqJzZr8yuVI", None),
            ]},
        ],
        days_ago=5,
    ),
    _course(
        "butterfly-foundations",
        "Butterfly Foundations",
        "The defined-risk structure at the heart of the FatTail method — built from first principles.",
        "beginner",
        ["butterflies", "0-dte"],
        "Learn to construct, read, and manage the butterfly — the defined-risk options "
        "structure whose known-cost, convex payoff makes it the natural vehicle for the "
        "stop-the-bleeding doctrine.\n\n"
        "By the end of this course, you will have:\n\n"
        "- The ability to find a butterfly setup in seconds, not hours\n"
        "- A strike-selection method that can cut your cost dramatically\n"
        "- A construction checklist for placing your first defined-risk butterfly\n\n"
        "This course is designed for traders new to defined-risk structures who want the "
        "mechanics grounded in why the structure fits the doctrine.",
        [
            {"title": "Module 1 — Anatomy of the Butterfly", "kind": "standard", "lessons": [
                ("butterfly-anatomy", "Find Your Butterfly Setup in 30 Seconds", "video", 227, 1, "L-3haLrKruk", None),
                ("strike-selection", "How One Strike Change Cuts Your Cost in Half", "video", 216, 0, "J7amM5JzfvE", None),
                ("half-price-return", "How to Get the Same Return for Half the Price", "video", 244, 0, "eu5gomCcV14", None),
            ]},
        ],
        days_ago=3,
        attachments=[("Butterfly Construction Checklist", "file")],
        trailer="L-3haLrKruk",
    ),
    _course(
        "convexity-and-asymmetry",
        "Convexity & Asymmetry",
        "Why a 30% win rate can be profitable, and how to engineer trades where the math works for you.",
        "intermediate",
        ["convexity", "fat-tail-doctrine"],
        "Stop thinking in win rates and start thinking in payoff shapes. Convexity is how "
        "small, known losses buy you unbounded upside — the mathematical heart of the "
        "FatTail approach.\n\n"
        "By the end of this course, you will have:\n\n"
        "- The payoff-shape mental model that replaces win-rate thinking\n"
        "- An understanding of why a fraction of trading days carries all the results\n"
        "- A framework for engineering trades where losing the right way funds the winners\n\n"
        "This course is designed for traders who understand the basics and are ready for "
        "the math that makes asymmetry a system instead of a slogan.",
        [
            {"title": "Module 1 — The Shape of the Payoff", "kind": "standard", "lessons": [
                ("thirty-percent-win-rate", "How a 30% Win Rate Can Still Make You Profitable", "video", 212, 1, "S9r3OJ9LWsA", None),
                ("twenty-percent-days", "Why 20% of Trading Days Make All the Money", "video", 285, 0, "FyTw670zC_o", None),
            ]},
            {"title": "Module 2 — Engineering the Asymmetry", "kind": "standard", "lessons": [
                ("losing-the-right-way", "How Losing the Right Way Pays for Your Winners", "video", 240, 0, "fou06Q8gZ7Y", None),
                ("engineer-your-trades", "How to Engineer Your 0DTE Trades to Always Make Money", "video", 217, 0, "vto-Iz-QLYQ", None),
            ]},
        ],
    ),
    _course(
        "the-fat-tail-doctrine",
        "The Fat-Tail Doctrine",
        "Position, don't predict. The evidence and the discipline behind trading the tails.",
        "intermediate",
        ["fat-tail-doctrine", "convexity"],
        "The market's biggest moves cluster in the tails — and the doctrine says you "
        "position for them instead of predicting them. This course lays out the evidence "
        "and the discipline that follows from it.\n\n"
        "By the end of this course, you will have:\n\n"
        "- The 25-year evidence base for why tails drive everything\n"
        "- A directionless entry method that removes prediction from the process\n"
        "- The psychological footing to absorb losing streaks without flinching\n\n"
        "This course is designed for traders ready to trade the distribution instead of "
        "their opinions.",
        [
            {"title": "Module 1 — Position, Don't Predict", "kind": "standard", "lessons": [
                ("twenty-five-year-proof", "The 25 Year Proof That Changes How You Trade Forever", "video", 231, 1, "E5HLrZDrzuQ", None),
                ("stop-guessing-direction", "STOP Guessing 0DTE Direction — Pick It Without Predicting", "video", 197, 0, "V5Rf0EigtIE", None),
                ("streak-immunity", "Why I Can Lose 10 0DTE Trades in a Row and Not Care", "video", 179, 0, "Tm4a50RpJxs", None),
            ]},
        ],
    ),
    _course(
        "sizing-and-capital-gates",
        "Sizing & Capital Gates",
        "Risk decisions happen before entry. Sizing, doubling, and protecting — all by structure, not nerve.",
        "beginner",
        ["risk-sizing"],
        "Every risk decision in this system is made before you enter — the size, the gate, "
        "the exit conditions. This course builds that pre-commitment machinery.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A pre-entry risk process that never needs managing mid-trade\n"
        "- A method for scaling position size without scaling risk\n"
        "- A profit-protection approach that doesn't strangle winners\n\n"
        "This course is designed for traders whose losses come from in-trade decisions "
        "they never planned to make.",
        [
            {"title": "Module 1 — Decide Before You Enter", "kind": "standard", "lessons": [
                ("never-manage-after-entry", "Why I Never Manage Risk After I Enter a Trade", "video", 240, 1, "tTM9Uo7dydE", None),
                ("double-without-doubling", "How I Double My Position Without Doubling My Risk", "video", 279, 0, "GgZ8LTOw6U4", None),
                ("protect-without-cutting", "How I Protect 0DTE Profits Without Cutting Them Short", "video", 230, 0, "N548S4tSdLE", None),
            ]},
        ],
    ),
    _course(
        "the-trading-routine",
        "The Trading Routine",
        "Preparation, selection, and the log. The daily procedure that compounds into an edge.",
        "beginner",
        ["journaling-routine"],
        "Edge is not a secret — it's a procedure repeated until it compounds. This course "
        "installs the daily routine: pre-market preparation, effortless trade selection, "
        "and the journal that keeps the whole system honest.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A pre-market preparation sequence that sets trades up before the open\n"
        "- A selection playbook that makes the daily decision nearly automatic\n"
        "- A journaling practice backed by four years of real trade data as the model\n\n"
        "This course is designed for traders whose results swing with their moods instead "
        "of their process.",
        [
            {"title": "Module 1 — The Daily Procedure", "kind": "standard", "lessons": [
                ("before-the-open", "How to Set Up Winning Trades Before the Market Even Opens", "video", 337, 1, "SqBJz9YkzeU", None),
                ("selection-playbook", "The Playbook That Makes 0DTE Trade Selection Effortless", "video", 208, 0, "ikbQaAoxLwc", None),
                ("four-years-of-numbers", "4 Years of 0DTE SPX Trades — Here Are the Real Numbers", "video", 217, 0, "lFiZStVUoHI", None),
            ]},
        ],
    ),
    _course(
        "marketswarm-platform-primer",
        "MarketSwarm Platform Primer",
        "The FatTail App: market structure, the heatmap, and finding your structure in seconds.",
        "beginner",
        ["marketswarm-platform"],
        "The FatTail App turns the doctrine into instruments: market structure on screen, "
        "a heatmap that surfaces candidate structures, and a risk graph that shows your "
        "worst case before entry. This primer gets you operating it.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A working read of market structure for 0-DTE SPX entries\n"
        "- The heatmap workflow for finding a butterfly setup in seconds\n"
        "- The habit of reading the risk graph before every entry\n\n"
        "This course is designed for members ready to run the doctrine inside the "
        "platform built for it.",
        [
            {"title": "Module 1 — Operating the Platform", "kind": "standard", "lessons": [
                ("entries-with-structure", "How to Find 0DTE SPX Entries With Market Structure", "video", 186, 1, "Clg8fDym2yE", None),
                ("heatmap-in-30-seconds", "Find Your Butterfly Setup in 30 Seconds", "video", 227, 0, "L-3haLrKruk", None),
            ]},
        ],
    ),
    _course(
        "options-foundations",
        "Options Foundations",
        "The vocabulary and mechanics — strikes, debits, expiration — grounded in real structures.",
        "beginner",
        ["options-foundations"],
        "Before doctrine comes vocabulary: what an option really prices, what a debit "
        "buys you, and why expiration day changes everything. Taught through real "
        "structures, not textbook abstractions.\n\n"
        "By the end of this course, you will have:\n\n"
        "- A working vocabulary of strikes, debits, and expiration mechanics\n"
        "- An understanding of how strike selection changes cost and payoff\n"
        "- The foundation to step into defined-risk structures with confidence\n\n"
        "This course is designed for traders new to options who want the fundamentals "
        "taught the FatTail way.",
        [
            {"title": "Module 1 — The Mechanics That Matter", "kind": "standard", "lessons": [
                ("expiration-day-basics", "What Is 0DTE? The Opportunity Explained", "video", 265, 1, "7Xx730889UM", None),
                ("cost-and-payoff", "Same Return, Half the Price: How Structure Sets Cost", "video", 244, 0, "eu5gomCcV14", None),
            ]},
        ],
    ),
    _course(
        "trader-psychology",
        "Trader Psychology",
        "Experience doesn't fix you. Structure does. The psychology of staying whole.",
        "beginner",
        ["psychology"],
        "More screen time doesn't make you a better trader — unlearning the habits that "
        "bleed you does. This course covers the psychological failure modes and the "
        "structural answers to each.\n\n"
        "By the end of this course, you will have:\n\n"
        "- An honest account of why experience alone doesn't improve results\n"
        "- The anti-chasing discipline that protects you from your best trades\n"
        "- A structural answer to the rookie mistake that turns winners into losers\n\n"
        "This course is designed for traders who know their biggest risk is in the "
        "mirror.",
        [
            {"title": "Module 1 — The Failure Modes", "kind": "standard", "lessons": [
                ("experience-myth", "Why Experience Doesn't Make You a Better Trader", "video", 219, 1, "2nwbzj4OUO8", None),
                ("stop-chasing", "Why 0DTE Winners Stop Chasing — And Most Traders Never Do", "video", 226, 0, "Cq3pcGgm8qc", None),
                ("rookie-mistake", "The Rookie 0DTE Mistake That Turns Winners Into Losers", "video", 338, 0, "EXvj2AAaVIc", None),
            ]},
        ],
    ),
    _course(
        "advanced-convexity-lab",
        "Advanced Convexity Lab",
        "DRAFT — not yet published.",
        "advanced",
        ["convexity"],
        "Draft course used to verify draft invisibility in public payloads.",
        [
            {"title": "Module 1 — Draft Material", "kind": "standard", "lessons": [
                ("draft-lesson", "Draft Lesson", "video", 600, 0, "aqz-KE-bpKQ", None),
            ]},
        ],
        status="draft", days_ago=None,
    ),
]


def seed() -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for slug, name, grants, display in PLANS:
                cur.execute(
                    "INSERT INTO plans (slug, name, grants_role, display_json) "
                    "VALUES (%s, %s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE name = VALUES(name), "
                    "grants_role = VALUES(grants_role), display_json = VALUES(display_json)",
                    (slug, name, grants, json.dumps(display) if display else None),
                )
            for provider, external_key, plan_slug in PROVIDER_PLAN_MAP:
                cur.execute(
                    """INSERT IGNORE INTO provider_plan_map (provider, external_key, plan_id)
                       SELECT %s, %s, id FROM plans WHERE slug = %s""",
                    (provider, external_key, plan_slug),
                )
            for title, kind, days, start_time, duration, category, join_url in RECURRENCES:
                cur.execute("SELECT 1 FROM live_recurrences WHERE title = %s", (title,))
                if cur.fetchone() is None:
                    cur.execute(
                        """INSERT INTO live_recurrences
                           (title, kind, days, start_time, duration_minutes, category, join_url)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (title, kind, days, start_time, duration, category, join_url),
                    )
            for slug, name, description in CATEGORIES:
                cur.execute(
                    "INSERT INTO categories (slug, name, description_md) "
                    "VALUES (%s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE name = VALUES(name), "
                    "description_md = VALUES(description_md)",
                    (slug, name, description),
                )

            instructor_ids: dict[str, int] = {}
            for name, bio, avatar in INSTRUCTORS:
                cur.execute("SELECT id FROM instructors WHERE name = %s", (name,))
                row = cur.fetchone()
                if row:
                    instructor_ids[name] = row["id"]
                else:
                    cur.execute(
                        "INSERT INTO instructors (name, bio_md, avatar_url) VALUES (%s, %s, %s)",
                        (name, bio, avatar),
                    )
                    instructor_ids[name] = cur.lastrowid

            for course in COURSES:
                cur.execute("SELECT id FROM courses WHERE slug = %s", (course["slug"],))
                row = cur.fetchone()
                if row:
                    continue
                published_expr = (
                    f"DATE_SUB(NOW(), INTERVAL {int(course['published_days_ago'])} DAY)"
                    if course["published_days_ago"] is not None
                    else "NULL"
                )
                cur.execute(
                    f"""INSERT INTO courses
                        (slug, title, subtitle, description_md, level, status,
                         certification_enabled, trailer_video_id, published_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, {published_expr})""",
                    (
                        course["slug"], course["title"], course["subtitle"],
                        course["description_md"], course["level"], course["status"],
                        course["certification_enabled"], course.get("trailer_video_id"),
                    ),
                )
                course_id = cur.lastrowid

                for cat_slug in course["categories"]:
                    cur.execute(
                        """INSERT IGNORE INTO course_categories (course_id, category_id)
                           SELECT %s, id FROM categories WHERE slug = %s""",
                        (course_id, cat_slug),
                    )
                for order, iname in enumerate(course["instructors"]):
                    cur.execute(
                        "INSERT IGNORE INTO course_instructors "
                        "(course_id, instructor_id, sort_order) VALUES (%s, %s, %s)",
                        (course_id, instructor_ids[iname], order),
                    )
                for m_order, module in enumerate(course["modules"]):
                    cur.execute(
                        "INSERT INTO modules (course_id, title, sort_order, kind) "
                        "VALUES (%s, %s, %s, %s)",
                        (course_id, module["title"], m_order, module["kind"]),
                    )
                    module_id = cur.lastrowid
                    for l_order, (
                        lslug, ltitle, lkind, dur, preview, vid, vparams,
                    ) in enumerate(module["lessons"]):
                        cur.execute(
                            """INSERT INTO lessons
                               (module_id, slug, title, sort_order, kind,
                                duration_seconds, free_preview,
                                video_provider, video_id, video_params)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, 'youtube', %s, %s)""",
                            (module_id, lslug, ltitle, l_order, lkind, dur, preview,
                             vid, json.dumps(vparams) if vparams else None),
                        )
                for a_title, a_kind in course["attachments"]:
                    cur.execute(
                        """INSERT INTO attachments (owner_type, owner_id, title, kind, url)
                           VALUES ('course', %s, %s, %s, '')""",
                        (course_id, a_title, a_kind),
                    )

            cur.execute("SELECT COUNT(*) AS n FROM courses")
            courses_n = cur.fetchone()["n"]
            cur.execute("SELECT COUNT(*) AS n FROM lessons")
            lessons_n = cur.fetchone()["n"]
    print(f"seeded: {courses_n} courses, {lessons_n} lessons")


if __name__ == "__main__":
    seed()

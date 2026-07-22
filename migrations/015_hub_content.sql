-- 015 — Editable course hub page content + FAQ (in-place admin)
-- site_pages: per-page CMS fields for non-course public pages.
-- site_faq_items: ordered Q&A; answer is markdown (images via media URLs).

CREATE TABLE IF NOT EXISTS site_pages (
  slug                VARCHAR(64)  NOT NULL,
  title               VARCHAR(512) NOT NULL,
  description_md      MEDIUMTEXT,
  intro_video_id      VARCHAR(32)  NULL,
  intro_video_title   VARCHAR(512) NULL,
  faq_title           VARCHAR(512) NOT NULL DEFAULT 'FAQ',
  faq_description_md  MEDIUMTEXT,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_faq_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_slug   VARCHAR(64)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  question    VARCHAR(1024) NOT NULL,
  answer_md   MEDIUMTEXT   NOT NULL,
  PRIMARY KEY (id),
  KEY ix_faq_page_order (page_slug, sort_order),
  CONSTRAINT fk_faq_page FOREIGN KEY (page_slug)
    REFERENCES site_pages (slug) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_pages (
  slug, title, description_md, intro_video_id, intro_video_title,
  faq_title, faq_description_md
) VALUES (
  'hub',
  'Course hub',
  'FatTail Labs is a membership course library for convex options trading, built on capital preservation. The doctrine is “first, stop the bleeding”: survive unbounded losers before chasing winners. Courses cover defined-risk structures (especially butterflies), 0-DTE, sizing, psychology, and routine. Start with the flagship course, First, Stop the Bleeding.',
  'izSfocWOB0E',
  'First, stop the bleeding — the FatTail Labs doctrine',
  'Course hub FAQ',
  'Quick answers about the library, where to start, and how access works.'
) ON DUPLICATE KEY UPDATE slug = slug;

INSERT INTO site_faq_items (page_slug, sort_order, question, answer_md)
SELECT 'hub', 0, 'What is FatTail Labs?',
  'FatTail Labs is a membership course library for convex options trading, built on capital preservation. The doctrine is “first, stop the bleeding”: survive unbounded losers before chasing winners. Courses cover defined-risk structures (especially butterflies), 0-DTE, sizing, psychology, and routine. Start with the flagship course, First, Stop the Bleeding.'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM site_faq_items WHERE page_slug = 'hub' AND question = 'What is FatTail Labs?'
);

INSERT INTO site_faq_items (page_slug, sort_order, question, answer_md)
SELECT 'hub', 1, 'Where should I start in the course library?',
  'Start with the flagship course, [First, Stop the Bleeding](/courses/first-stop-the-bleeding). Capital preservation is the prerequisite for every other course on the pathway.'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM site_faq_items WHERE page_slug = 'hub' AND question = 'Where should I start in the course library?'
);

INSERT INTO site_faq_items (page_slug, sort_order, question, answer_md)
SELECT 'hub', 2, 'How many courses does FatTail Labs offer?',
  'The published library covers capital preservation, butterflies, 0-DTE, convexity, risk sizing, psychology, journaling, options foundations, and the MarketSwarm platform. Browse the categories above for the full list.'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM site_faq_items WHERE page_slug = 'hub' AND question = 'How many courses does FatTail Labs offer?'
);

INSERT INTO site_faq_items (page_slug, sort_order, question, answer_md)
SELECT 'hub', 3, 'Are courses free?',
  'Catalog and course pages are public. Free-preview lessons are open (video needs a free account). Full access is a [membership](/membership) benefit.'
FROM DUAL WHERE NOT EXISTS (
  SELECT 1 FROM site_faq_items WHERE page_slug = 'hub' AND question = 'Are courses free?'
);

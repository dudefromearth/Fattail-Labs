-- 031 — Rename Labs section hub display title to Apps (matches /app URL namespace)
-- site_pages.slug stays 'labs' for stable CMS/API keys

UPDATE site_pages
SET title = 'Apps',
    faq_title = CASE
      WHEN faq_title = 'Labs FAQ' OR faq_title IS NULL THEN 'Apps FAQ'
      ELSE faq_title
    END,
    description_md = REPLACE(
      REPLACE(description_md, 'Labs is where', 'Apps is where'),
      'Member **practice tools**',
      'Member **practice apps**'
    )
WHERE slug = 'labs';

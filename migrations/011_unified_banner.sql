-- 011 — unified course banner (Course Card Editor spec v1.1): the card and the
-- course page header share hero_image_url. The hover quick-view popup is
-- removed, so card_blurb_md goes; card_image_url is superseded by the shared
-- banner. card_color remains the no-image banner choice.

ALTER TABLE courses DROP COLUMN card_image_url;
ALTER TABLE courses DROP COLUMN card_blurb_md;

ALTER TABLE community_reviews
  ADD COLUMN mask_name boolean,
  DROP CONSTRAINT community_reviews_display_name_check,
  ADD CONSTRAINT community_reviews_display_name_check
    CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100);

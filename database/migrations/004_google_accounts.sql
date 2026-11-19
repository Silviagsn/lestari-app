ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN google_sub text UNIQUE,
  ADD CONSTRAINT users_have_sign_in_method CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL),
  ADD CONSTRAINT users_google_public_roles_only CHECK (google_sub IS NULL OR role IN ('jobseeker', 'company'));

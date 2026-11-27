CREATE TABLE community_reviews (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 60),
  comment text NOT NULL CHECK (char_length(btrim(comment)) BETWEEN 1 AND 600),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX community_reviews_recent_idx ON community_reviews (updated_at DESC, id DESC);

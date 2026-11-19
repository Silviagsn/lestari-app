CREATE TABLE profile_avatars (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version uuid NOT NULL,
  jpeg bytea NOT NULL CHECK (octet_length(jpeg) BETWEEN 1 AND 524288)
);

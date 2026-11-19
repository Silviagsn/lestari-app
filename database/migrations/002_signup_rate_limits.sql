CREATE TABLE signup_rate_limits (
  client_ip inet PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts BETWEEN 1 AND 6),
  expires_at timestamptz NOT NULL
);

CREATE INDEX signup_rate_limits_expiry_idx ON signup_rate_limits (expires_at);

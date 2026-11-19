CREATE TABLE google_oauth_flows (
  state_hash text PRIMARY KEY,
  browser_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('jobseeker', 'company')),
  intent text NOT NULL CHECK (intent IN ('login', 'signup')),
  verifier text NOT NULL,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX google_oauth_flows_expiry_idx ON google_oauth_flows (expires_at);

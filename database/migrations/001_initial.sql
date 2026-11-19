CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  phone text UNIQUE,
  role text NOT NULL CHECK (role IN ('jobseeker', 'company', 'admin')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_expiry_idx ON sessions (expires_at);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE jobs (
  id integer PRIMARY KEY,
  details jsonb NOT NULL CHECK (
    jsonb_typeof(details) = 'object' AND
    (details->'id') IS NOT DISTINCT FROM to_jsonb(id)
  )
);

CREATE TABLE workshops (
  id integer PRIMARY KEY,
  details jsonb NOT NULL CHECK (
    jsonb_typeof(details) = 'object' AND
    (details->'id') IS NOT DISTINCT FROM to_jsonb(id)
  )
);

CREATE TABLE saved_jobs (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id integer NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE saved_workshops (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id integer NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, workshop_id)
);

CREATE TABLE applications (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id integer NOT NULL REFERENCES jobs(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  cover_letter text NOT NULL DEFAULT '',
  communication_preference text NOT NULL CHECK (
    communication_preference IN ('email', 'text', 'video-asl', 'written-chat')
  ),
  availability_date date,
  salary_expectation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'applied' CHECK (
    status IN ('applied', 'reviewing', 'interview', 'offer', 'rejected')
  ),
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE enrollments (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id integer NOT NULL REFERENCES workshops(id),
  status text NOT NULL DEFAULT 'enrolled' CHECK (
    status IN ('enrolled', 'in-progress', 'completed', 'paused')
  ),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workshop_id)
);

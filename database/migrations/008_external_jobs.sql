ALTER TABLE jobs
  ADD COLUMN external_url text,
  ADD CONSTRAINT jobs_external_source_check CHECK (
    external_url IS NULL OR (
      company_user_id IS NULL
      AND status IN ('published', 'closed')
      AND external_url ~ '^https://id\.jobstreet\.com/id/job/[1-9][0-9]{0,19}$'
    )
  );

CREATE UNIQUE INDEX jobs_external_url_idx ON jobs (external_url) WHERE external_url IS NOT NULL;

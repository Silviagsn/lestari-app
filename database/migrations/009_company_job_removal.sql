ALTER TABLE jobs
  ADD COLUMN deleted_at timestamptz,
  ADD CONSTRAINT jobs_deleted_company_check CHECK (
    deleted_at IS NULL OR (company_user_id IS NOT NULL AND status = 'closed')
  );

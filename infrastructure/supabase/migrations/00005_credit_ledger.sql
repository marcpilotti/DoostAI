-- Credit ledger for tracking AI image generation credits
CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type text NOT NULL,
  model_used text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_org ON credit_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_credit_org_date ON credit_ledger(org_id, created_at);

ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_ledger_org_isolation" ON credit_ledger
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

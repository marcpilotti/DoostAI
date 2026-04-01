-- Campaign event sourcing table
-- Append-only — never update or delete rows

CREATE TABLE IF NOT EXISTS campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_state text NOT NULL,
  to_state text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  actor text DEFAULT 'system',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id
  ON campaign_events(campaign_id, created_at);

CREATE INDEX IF NOT EXISTS idx_campaign_events_org_id
  ON campaign_events(org_id, created_at);

-- Enable RLS
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_events_org_isolation" ON campaign_events
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

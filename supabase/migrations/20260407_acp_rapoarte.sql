-- ACP Rapoarte: stores generated market analysis reports
CREATE TABLE acp_rapoarte (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  agent_id UUID REFERENCES auth.users(id),
  nume_proprietar TEXT,
  telefon_proprietar TEXT,
  tip_proprietate TEXT,
  judet TEXT,
  localitate TEXT,
  adresa TEXT,
  pret_recomandat INTEGER,
  pret_solicitat INTEGER,
  interval_min INTEGER,
  interval_max INTEGER,
  pret_mediu_mp INTEGER,
  result_json JSONB
);

CREATE INDEX ON acp_rapoarte(agent_id);
CREATE INDEX ON acp_rapoarte(telefon_proprietar);
CREATE INDEX ON acp_rapoarte(nume_proprietar);

-- RLS: agents can only access their own reports
ALTER TABLE acp_rapoarte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own reports"
  ON acp_rapoarte FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Agents insert own reports"
  ON acp_rapoarte FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents delete own reports"
  ON acp_rapoarte FOR DELETE
  USING (agent_id = auth.uid());

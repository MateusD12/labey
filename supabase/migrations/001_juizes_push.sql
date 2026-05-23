-- Juizes por torneio
CREATE TABLE IF NOT EXISTS torneio_juizes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  torneio_id uuid REFERENCES torneios(id) ON DELETE CASCADE,
  blade_id uuid REFERENCES perfis(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(torneio_id, blade_id)
);

-- Coluna de juiz nas partidas
ALTER TABLE partidas ADD COLUMN IF NOT EXISTS juiz_id uuid REFERENCES perfis(id);

-- Subscricoes de push (uma por usuario)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blade_id uuid REFERENCES perfis(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blade_id)
);

-- RLS: torneio_juizes
ALTER TABLE torneio_juizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica torneio_juizes" ON torneio_juizes FOR SELECT USING (true);
CREATE POLICY "Admin gerencia torneio_juizes" ON torneio_juizes FOR ALL USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND is_admin = true)
);

-- RLS: push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gerencia propria subscription" ON push_subscriptions FOR ALL USING (blade_id = auth.uid());
CREATE POLICY "Service role le subscriptions" ON push_subscriptions FOR SELECT USING (true);

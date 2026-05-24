-- =============================================================
-- Seed: 200 perfis falsos + 3 torneios Copa do Mundo grandes
-- =============================================================

-- -------------------------------------------------------
-- 1. PERFIS FALSOS (e0000001 ... e0000200)
-- -------------------------------------------------------
DO $$
DECLARE
  i   int;
  uid uuid;
  pref text[] := ARRAY['Dragon','Thunder','Shadow','Phoenix','Iron',
                        'Crystal','Vortex','Storm','Blade','Blaze',
                        'Frost','Sonic','Titan','Nova','Turbo',
                        'Steel','Fire','Ice','Wind','Rock'];
  sfx  text[] := ARRAY['Master','Knight','Raider','Striker','Hunter',
                        'King','Warrior','Champion','Slayer','Rider'];
BEGIN
  FOR i IN 1..200 LOOP
    uid := ('e' || lpad(i::text,7,'0') || '-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      confirmation_token, recovery_token,
      email_change, email_change_token_new,
      email_change_token_current
    ) VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'fbld_' || lpad(i::text,3,'0') || '@labey.fake',
      '',
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, now(), now(),
      '', '', '', '', ''
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO perfis (id, username, nome_display, is_admin, is_juiz)
    VALUES (
      uid,
      lower(pref[((i-1) % 20) + 1]) || '_' ||
        lower(sfx[((i-1) / 20 % 10) + 1]) || '_' ||
        lpad(i::text,3,'0'),
      pref[((i-1) % 20) + 1] || ' ' || sfx[((i-1) / 20 % 10) + 1] || ' #' || i,
      false,
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 2. TORNEIOS
-- -------------------------------------------------------
INSERT INTO torneios (
  id, nome, descricao, formato, status,
  pontos_vitoria, pontos_empate, pontos_derrota,
  num_grupos, classificados_por_grupo, num_rodadas_suico,
  max_participantes, premio
) VALUES
  (
    'b2000001-0000-0000-0000-000000000001',
    'Copa LaBey SP 2025',
    'Copa do Mundo — 100 bladers — São Paulo',
    'copa_do_mundo', 'em_andamento',
    3, 1, 0,
    10, 2, 5,
    100, '🏆 Troféu Copa SP'
  ),
  (
    'b2000002-0000-0000-0000-000000000002',
    'Copa LaBey Rio 2025',
    'Copa do Mundo — 64 bladers — Rio de Janeiro',
    'copa_do_mundo', 'em_andamento',
    3, 1, 0,
    8, 2, 5,
    64, '🥇 Troféu Copa Rio'
  ),
  (
    'b2000003-0000-0000-0000-000000000003',
    'Copa LaBey Brasil 2025',
    'Copa do Mundo — 200 bladers — Nacional',
    'copa_do_mundo', 'em_andamento',
    3, 1, 0,
    20, 2, 5,
    200, '👑 Troféu Copa Brasil'
  )
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 3. INSCRIÇÕES APROVADAS
-- -------------------------------------------------------
-- Copa SP: fighters 1-100
INSERT INTO inscricoes (torneio_id, blade_id, status)
SELECT
  'b2000001-0000-0000-0000-000000000001',
  ('e' || lpad(i::text,7,'0') || '-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
  'aprovado'
FROM generate_series(1,100) AS g(i)
ON CONFLICT DO NOTHING;

-- Copa Rio: fighters 1-64
INSERT INTO inscricoes (torneio_id, blade_id, status)
SELECT
  'b2000002-0000-0000-0000-000000000002',
  ('e' || lpad(i::text,7,'0') || '-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
  'aprovado'
FROM generate_series(1,64) AS g(i)
ON CONFLICT DO NOTHING;

-- Copa Brasil: fighters 1-200
INSERT INTO inscricoes (torneio_id, blade_id, status)
SELECT
  'b2000003-0000-0000-0000-000000000003',
  ('e' || lpad(i::text,7,'0') || '-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
  'aprovado'
FROM generate_series(1,200) AS g(i)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 4. DISTRIBUIÇÃO DE GRUPOS (modulo round-robin)
-- -------------------------------------------------------
-- Copa SP: 10 grupos (A-J)
UPDATE inscricoes
SET grupo = chr(65 + ((rn - 1) % 10)::int)
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY blade_id) AS rn
  FROM inscricoes
  WHERE torneio_id = 'b2000001-0000-0000-0000-000000000001'
) ranked
WHERE inscricoes.id = ranked.id;

-- Copa Rio: 8 grupos (A-H)
UPDATE inscricoes
SET grupo = chr(65 + ((rn - 1) % 8)::int)
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY blade_id) AS rn
  FROM inscricoes
  WHERE torneio_id = 'b2000002-0000-0000-0000-000000000002'
) ranked
WHERE inscricoes.id = ranked.id;

-- Copa Brasil: 20 grupos (A-T)
UPDATE inscricoes
SET grupo = chr(65 + ((rn - 1) % 20)::int)
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY blade_id) AS rn
  FROM inscricoes
  WHERE torneio_id = 'b2000003-0000-0000-0000-000000000003'
) ranked
WHERE inscricoes.id = ranked.id;

-- -------------------------------------------------------
-- 5. PARTIDAS DE GRUPO (round-robin dentro de cada grupo)
-- -------------------------------------------------------
INSERT INTO partidas (torneio_id, fase, grupo, blade1_id, blade2_id, status)
SELECT
  i1.torneio_id,
  'grupos',
  i1.grupo,
  i1.blade_id,
  i2.blade_id,
  'pendente'
FROM inscricoes i1
JOIN inscricoes i2
  ON  i1.torneio_id = i2.torneio_id
  AND i1.grupo      = i2.grupo
  AND i1.blade_id   < i2.blade_id
WHERE i1.torneio_id IN (
  'b2000001-0000-0000-0000-000000000001',
  'b2000002-0000-0000-0000-000000000002',
  'b2000003-0000-0000-0000-000000000003'
)
  AND i1.status = 'aprovado'
  AND i2.status = 'aprovado';

-- -------------------------------------------------------
-- Resumo
-- -------------------------------------------------------
SELECT
  t.nome,
  COUNT(DISTINCT i.blade_id)  AS participantes,
  COUNT(DISTINCT p.id)        AS partidas_grupo
FROM torneios t
LEFT JOIN inscricoes i ON i.torneio_id = t.id AND i.status = 'aprovado'
LEFT JOIN partidas   p ON p.torneio_id = t.id AND p.fase = 'grupos'
WHERE t.id IN (
  'b2000001-0000-0000-0000-000000000001',
  'b2000002-0000-0000-0000-000000000002',
  'b2000003-0000-0000-0000-000000000003'
)
GROUP BY t.nome;

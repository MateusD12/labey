-- =============================================================
-- Seed: 6 formatos × 3 tamanhos (8, 64, 100 participantes)
-- IDs: a{formato}{size_hex}-0000-0000-0000-000000000001
--   formato: 1=elim_simples 2=elim_duplo 3=copa 4=suico 5=grupos 6=roundrobin
--   size_hex: 08=8p  40=64p  64=100p
-- Grupos: max 4 jogadores/grupo (círculo 3 rodadas), numero_rodada corretamente atribuído
-- =============================================================

-- -------------------------------------------------------
-- 1. LIMPAR TODOS OS TORNEIOS
-- -------------------------------------------------------
DELETE FROM partidas         WHERE TRUE;
DELETE FROM inscricoes       WHERE TRUE;
DELETE FROM ranking_torneios WHERE TRUE;
DELETE FROM torneio_juizes   WHERE TRUE;
DELETE FROM torneios         WHERE TRUE;

-- -------------------------------------------------------
-- 2. PERFIS FALSOS (200) — atualiza se já existir
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
      email_change, email_change_token_new, email_change_token_current
    ) VALUES (
      uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'fbld_' || lpad(i::text,3,'0') || '@labey.fake',
      '', now(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', '', '', '', ''
    ) ON CONFLICT DO NOTHING;
    INSERT INTO perfis (id, username, nome_display, is_admin, is_juiz)
    VALUES (
      uid,
      lower(pref[((i-1) % 20) + 1]) || '_' || lower(sfx[((i-1) / 20 % 10) + 1]) || '_' || lpad(i::text,3,'0'),
      pref[((i-1) % 20) + 1] || ' ' || sfx[((i-1) / 20 % 10) + 1] || ' #' || i,
      false, false
    ) ON CONFLICT (id) DO UPDATE
      SET username     = EXCLUDED.username,
          nome_display = EXCLUDED.nome_display;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 3. TORNEIOS (18)
--    Fase de Grupos: max 4/grupo → 8p=2g, 64p=16g, 100p=25g
--    Copa do Mundo:  inscricoes (admin gera via UI)
-- -------------------------------------------------------
INSERT INTO torneios (id, nome, descricao, formato, status,
  pontos_vitoria, pontos_empate, pontos_derrota,
  num_grupos, classificados_por_grupo, num_rodadas_suico, num_rodadas_grupo,
  max_participantes, premio)
VALUES
  -- Eliminatório Simples
  ('a1000008-0000-0000-0000-000000000001','Elim Simples — 8p',  'Eliminatório simples, 8 participantes',  'eliminatorio_simples','em_andamento',3,1,0,NULL,NULL,NULL,NULL,8,  'Troféu ES-8'),
  ('a1000040-0000-0000-0000-000000000001','Elim Simples — 64p', 'Eliminatório simples, 64 participantes', 'eliminatorio_simples','em_andamento',3,1,0,NULL,NULL,NULL,NULL,64, 'Troféu ES-64'),
  ('a1000064-0000-0000-0000-000000000001','Elim Simples — 100p','Eliminatório simples, 100 participantes','eliminatorio_simples','em_andamento',3,1,0,NULL,NULL,NULL,NULL,100,'Troféu ES-100'),
  -- Eliminatório Duplo
  ('a2000008-0000-0000-0000-000000000001','Elim Duplo — 8p',  'Eliminatório duplo, 8 participantes',  'eliminatorio_duplo','em_andamento',3,1,0,NULL,NULL,NULL,NULL,8,  'Troféu ED-8'),
  ('a2000040-0000-0000-0000-000000000001','Elim Duplo — 64p', 'Eliminatório duplo, 64 participantes', 'eliminatorio_duplo','em_andamento',3,1,0,NULL,NULL,NULL,NULL,64, 'Troféu ED-64'),
  ('a2000064-0000-0000-0000-000000000001','Elim Duplo — 100p','Eliminatório duplo, 100 participantes','eliminatorio_duplo','em_andamento',3,1,0,NULL,NULL,NULL,NULL,100,'Troféu ED-100'),
  -- Copa do Mundo — inscricoes, admin gera via UI (fluxo com bracket pré-gerado)
  ('a3000008-0000-0000-0000-000000000001','Copa do Mundo — 8p',  'Copa do mundo, 8 participantes',  'copa_do_mundo','inscricoes',3,1,0, 2,2,NULL,3,8,  'Troféu CM-8'),
  ('a3000040-0000-0000-0000-000000000001','Copa do Mundo — 64p', 'Copa do mundo, 64 participantes', 'copa_do_mundo','inscricoes',3,1,0,16,2,NULL,3,64, 'Troféu CM-64'),
  ('a3000064-0000-0000-0000-000000000001','Copa do Mundo — 100p','Copa do mundo, 100 participantes','copa_do_mundo','inscricoes',3,1,0,25,2,NULL,3,100,'Troféu CM-100'),
  -- Suíço
  ('a4000008-0000-0000-0000-000000000001','Suico — 8p',  'Sistema suico, 8 participantes',  'suico','em_andamento',3,1,0,NULL,NULL,3,NULL,8,  'Troféu SU-8'),
  ('a4000040-0000-0000-0000-000000000001','Suico — 64p', 'Sistema suico, 64 participantes', 'suico','em_andamento',3,1,0,NULL,NULL,6,NULL,64, 'Troféu SU-64'),
  ('a4000064-0000-0000-0000-000000000001','Suico — 100p','Sistema suico, 100 participantes','suico','em_andamento',3,1,0,NULL,NULL,7,NULL,100,'Troféu SU-100'),
  -- Fase de Grupos (max 4/grupo: 8p→2g, 64p→16g, 100p→25g)
  ('a5000008-0000-0000-0000-000000000001','Fase de Grupos — 8p',  'Fase de grupos, 8 participantes',  'fase_grupos','em_andamento',3,1,0, 2,2,NULL,3,8,  'Troféu FG-8'),
  ('a5000040-0000-0000-0000-000000000001','Fase de Grupos — 64p', 'Fase de grupos, 64 participantes', 'fase_grupos','em_andamento',3,1,0,16,2,NULL,3,64, 'Troféu FG-64'),
  ('a5000064-0000-0000-0000-000000000001','Fase de Grupos — 100p','Fase de grupos, 100 participantes','fase_grupos','em_andamento',3,1,0,25,2,NULL,3,100,'Troféu FG-100'),
  -- Round Robin
  ('a6000008-0000-0000-0000-000000000001','Round Robin — 8p',  'Round robin, 8 participantes',  'round_robin','em_andamento',3,1,0,NULL,NULL,NULL,NULL,8,  'Troféu RR-8'),
  ('a6000040-0000-0000-0000-000000000001','Round Robin — 64p', 'Round robin, 64 participantes', 'round_robin','em_andamento',3,1,0,NULL,NULL,NULL,NULL,64, 'Troféu RR-64'),
  ('a6000064-0000-0000-0000-000000000001','Round Robin — 100p','Round robin, 100 participantes','round_robin','em_andamento',3,1,0,NULL,NULL,NULL,NULL,100,'Troféu RR-100')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 4. INSCRICOES (aprovado)
-- -------------------------------------------------------
DO $$
DECLARE
  i   int;
  uid uuid;
  sizes int[] := ARRAY[8, 64, 100];
  tids uuid[][] := ARRAY[
    ARRAY['a1000008-0000-0000-0000-000000000001'::uuid,'a1000040-0000-0000-0000-000000000001'::uuid,'a1000064-0000-0000-0000-000000000001'::uuid],
    ARRAY['a2000008-0000-0000-0000-000000000001'::uuid,'a2000040-0000-0000-0000-000000000001'::uuid,'a2000064-0000-0000-0000-000000000001'::uuid],
    ARRAY['a3000008-0000-0000-0000-000000000001'::uuid,'a3000040-0000-0000-0000-000000000001'::uuid,'a3000064-0000-0000-0000-000000000001'::uuid],
    ARRAY['a4000008-0000-0000-0000-000000000001'::uuid,'a4000040-0000-0000-0000-000000000001'::uuid,'a4000064-0000-0000-0000-000000000001'::uuid],
    ARRAY['a5000008-0000-0000-0000-000000000001'::uuid,'a5000040-0000-0000-0000-000000000001'::uuid,'a5000064-0000-0000-0000-000000000001'::uuid],
    ARRAY['a6000008-0000-0000-0000-000000000001'::uuid,'a6000040-0000-0000-0000-000000000001'::uuid,'a6000064-0000-0000-0000-000000000001'::uuid]
  ];
  fi int; si int;
BEGIN
  FOR fi IN 1..6 LOOP
    FOR si IN 1..3 LOOP
      FOR i IN 1..sizes[si] LOOP
        uid := ('e' || lpad(i::text,7,'0') || '-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid;
        INSERT INTO inscricoes (torneio_id, blade_id, status)
        VALUES (tids[fi][si], uid, 'aprovado')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 5. GRUPOS para fase_grupos (max 4/grupo)
--    8p → 2 grupos de 4, 64p → 16 grupos de 4, 100p → 25 grupos de 4
--    Copa do Mundo fica em inscricoes; admin atribui grupos ao gerar
-- -------------------------------------------------------
DO $$
DECLARE
  tids_ng record;
BEGIN
  FOR tids_ng IN
    SELECT tid_col, ng_col FROM (VALUES
      ('a5000008-0000-0000-0000-000000000001'::uuid,  2),
      ('a5000040-0000-0000-0000-000000000001'::uuid, 16),
      ('a5000064-0000-0000-0000-000000000001'::uuid, 25)
    ) AS t(tid_col, ng_col)
  LOOP
    UPDATE inscricoes
    SET grupo = chr(65 + ((rn - 1) % tids_ng.ng_col)::int)
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY blade_id) AS rn
      FROM inscricoes WHERE torneio_id = tids_ng.tid_col
    ) ranked
    WHERE inscricoes.id = ranked.id;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 6. PARTIDAS DE GRUPO (fase_grupos) com numero_rodada (algoritmo círculo)
--    4 jogadores/grupo → 3 rodadas, 2 partidas por rodada
--    Pares em ordem alfabética por (blade1_id, blade2_id):
--      rn=1 (p1,p2) → rodada 3 | rn=2 (p1,p3) → rodada 2 | rn=3 (p1,p4) → rodada 1
--      rn=4 (p2,p3) → rodada 1 | rn=5 (p2,p4) → rodada 2 | rn=6 (p3,p4) → rodada 3
-- -------------------------------------------------------
INSERT INTO partidas (torneio_id, fase, grupo, numero_rodada, blade1_id, blade2_id, status)
WITH pares AS (
  SELECT
    i1.torneio_id, i1.grupo,
    i1.blade_id AS blade1_id,
    i2.blade_id AS blade2_id,
    ROW_NUMBER() OVER (
      PARTITION BY i1.torneio_id, i1.grupo
      ORDER BY i1.blade_id, i2.blade_id
    ) AS rn
  FROM inscricoes i1
  JOIN inscricoes i2
    ON  i1.torneio_id = i2.torneio_id
    AND i1.grupo      = i2.grupo
    AND i1.blade_id   < i2.blade_id
  WHERE i1.torneio_id IN (
    'a5000008-0000-0000-0000-000000000001',
    'a5000040-0000-0000-0000-000000000001',
    'a5000064-0000-0000-0000-000000000001'
  )
  AND i1.status = 'aprovado' AND i2.status = 'aprovado'
)
SELECT
  torneio_id, 'grupos', grupo,
  CASE rn
    WHEN 1 THEN 3
    WHEN 2 THEN 2
    WHEN 3 THEN 1
    WHEN 4 THEN 1
    WHEN 5 THEN 2
    WHEN 6 THEN 3
    ELSE ((rn - 1) % 3) + 1   -- fallback for groups != 4 players
  END AS numero_rodada,
  blade1_id, blade2_id, 'pendente'
FROM pares;

-- -------------------------------------------------------
-- 7. ROUND ROBIN — rodadas distribuídas
-- -------------------------------------------------------
DO $$
DECLARE tid uuid;
BEGIN
  FOR tid IN SELECT unnest(ARRAY[
    'a6000008-0000-0000-0000-000000000001'::uuid,
    'a6000040-0000-0000-0000-000000000001'::uuid,
    'a6000064-0000-0000-0000-000000000001'::uuid
  ]) LOOP
    INSERT INTO partidas (torneio_id, fase, numero_rodada, blade1_id, blade2_id, status)
    WITH players AS (
      SELECT blade_id, ROW_NUMBER() OVER (ORDER BY blade_id) - 1 AS idx
      FROM inscricoes WHERE torneio_id = tid AND status = 'aprovado'
    ),
    n_val AS (SELECT COUNT(*)::int AS n FROM players),
    pairs AS (
      SELECT p1.blade_id AS b1, p2.blade_id AS b2,
             ROW_NUMBER() OVER (ORDER BY p1.idx, p2.idx) AS rn,
             (SELECT n FROM n_val) AS n
      FROM players p1 JOIN players p2 ON p1.idx < p2.idx
    )
    SELECT tid, 'round_robin',
           ((rn - 1) % GREATEST(n - 1, 1) + 1)::int,
           b1, b2, 'pendente'
    FROM pairs;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 8. SUICO — rodada 1
-- -------------------------------------------------------
DO $$
DECLARE tid uuid;
BEGIN
  FOR tid IN SELECT unnest(ARRAY[
    'a4000008-0000-0000-0000-000000000001'::uuid,
    'a4000040-0000-0000-0000-000000000001'::uuid,
    'a4000064-0000-0000-0000-000000000001'::uuid
  ]) LOOP
    INSERT INTO partidas (torneio_id, fase, numero_rodada, blade1_id, blade2_id, status)
    WITH ordered AS (
      SELECT blade_id, ROW_NUMBER() OVER (ORDER BY blade_id) AS rn
      FROM inscricoes WHERE torneio_id = tid AND status = 'aprovado'
    )
    SELECT tid, 'rodada_suica', 1, o1.blade_id, o2.blade_id, 'pendente'
    FROM ordered o1
    JOIN ordered o2 ON o2.rn = o1.rn + 1
    WHERE o1.rn % 2 = 1;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- 9. ELIMINATORIO (simples + duplo) — bracket completo
-- -------------------------------------------------------
DO $$
DECLARE
  tid       uuid;
  players   uuid[];
  n         int;
  bsize     int;
  rounds    int;
  b1        uuid; b2 uuid;
  r         int;  pos int;
  nmatch    int;
  fase_r1   text; fase_rn text;
BEGIN
  FOR tid IN SELECT unnest(ARRAY[
    'a1000008-0000-0000-0000-000000000001'::uuid,
    'a1000040-0000-0000-0000-000000000001'::uuid,
    'a1000064-0000-0000-0000-000000000001'::uuid,
    'a2000008-0000-0000-0000-000000000001'::uuid,
    'a2000040-0000-0000-0000-000000000001'::uuid,
    'a2000064-0000-0000-0000-000000000001'::uuid
  ]) LOOP
    SELECT ARRAY_AGG(blade_id ORDER BY blade_id) INTO players
    FROM inscricoes WHERE torneio_id = tid AND status = 'aprovado';

    n      := array_length(players, 1);
    bsize  := (2 ^ CEIL(ln(n::float) / ln(2.0)))::int;
    rounds := ROUND(ln(bsize::float) / ln(2.0))::int;

    WHILE array_length(players, 1) < bsize LOOP
      players := array_append(players, NULL::uuid);
    END LOOP;

    fase_r1 := CASE bsize
      WHEN 2   THEN 'final'
      WHEN 4   THEN 'semi'
      WHEN 8   THEN 'quartas'
      WHEN 16  THEN 'oitavas'
      WHEN 32  THEN 'decasseis'
      ELSE 'rodada_1'
    END;

    FOR pos IN 0 .. bsize/2 - 1 LOOP
      b1 := players[pos*2 + 1];
      b2 := players[pos*2 + 2];
      INSERT INTO partidas (torneio_id, fase, numero_rodada, posicao_bracket, blade1_id, blade2_id, vencedor_id, status)
      VALUES (tid, fase_r1, 1, pos, b1, b2,
        CASE WHEN b2 IS NULL THEN b1 ELSE NULL END,
        CASE WHEN b2 IS NULL THEN 'finalizada' ELSE 'pendente' END);
    END LOOP;

    FOR r IN 2 .. rounds LOOP
      nmatch  := bsize / (2^r)::int;
      fase_rn := CASE bsize / (2^(r-1))::int
        WHEN 2  THEN 'final'
        WHEN 4  THEN 'semi'
        WHEN 8  THEN 'quartas'
        WHEN 16 THEN 'oitavas'
        WHEN 32 THEN 'decasseis'
        ELSE 'rodada_' || r
      END;
      FOR pos IN 0 .. nmatch - 1 LOOP
        INSERT INTO partidas (torneio_id, fase, numero_rodada, posicao_bracket, blade1_id, blade2_id, status)
        VALUES (tid, fase_rn, r, pos, NULL, NULL, 'pendente');
      END LOOP;
    END LOOP;

  END LOOP;
END $$;

-- -------------------------------------------------------
-- 10. Propagar byes da rodada 1 para rodada 2
--     O trigger trg_propagate_bracket faz isso automaticamente,
--     mas o seed o faz diretamente para garantir estado inicial correto
-- -------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT id, torneio_id, numero_rodada, posicao_bracket, vencedor_id
    FROM partidas
    WHERE status = 'finalizada' AND vencedor_id IS NOT NULL
      AND numero_rodada = 1 AND posicao_bracket IS NOT NULL
      AND torneio_id IN (
        'a1000008-0000-0000-0000-000000000001','a1000040-0000-0000-0000-000000000001','a1000064-0000-0000-0000-000000000001',
        'a2000008-0000-0000-0000-000000000001','a2000040-0000-0000-0000-000000000001','a2000064-0000-0000-0000-000000000001'
      )
  LOOP
    UPDATE partidas
    SET blade1_id = CASE WHEN p.posicao_bracket % 2 = 0 THEN p.vencedor_id ELSE blade1_id END,
        blade2_id = CASE WHEN p.posicao_bracket % 2 = 1 THEN p.vencedor_id ELSE blade2_id END
    WHERE torneio_id      = p.torneio_id
      AND numero_rodada   = p.numero_rodada + 1
      AND posicao_bracket = p.posicao_bracket / 2;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Resumo
-- -------------------------------------------------------
SELECT t.nome, t.formato,
  (SELECT COUNT(*) FROM inscricoes  i WHERE i.torneio_id = t.id AND i.status = 'aprovado') AS inscritos,
  (SELECT COUNT(*) FROM partidas    p WHERE p.torneio_id = t.id) AS total_partidas,
  (SELECT COUNT(*) FROM partidas    p WHERE p.torneio_id = t.id AND p.status = 'pendente') AS pendentes,
  (SELECT COUNT(*) FROM partidas    p WHERE p.torneio_id = t.id AND p.numero_rodada IS NULL
    AND p.posicao_bracket IS NULL) AS grupos_sem_rodada
FROM torneios t
ORDER BY t.formato, inscritos;

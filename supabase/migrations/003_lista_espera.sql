-- Fila de espera para inscrições
-- Se existir check constraint no status, atualizar para incluir 'lista_espera'
DO $$
BEGIN
  -- Drop existing check constraint if present (nome pode variar)
  ALTER TABLE inscricoes DROP CONSTRAINT IF EXISTS inscricoes_status_check;
  -- Recreate allowing lista_espera
  ALTER TABLE inscricoes ADD CONSTRAINT inscricoes_status_check
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'lista_espera'));
EXCEPTION WHEN OTHERS THEN
  NULL; -- se não existia constraint, sem problema
END $$;

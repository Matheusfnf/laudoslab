-- Executar este script no Editor SQL do Supabase

-- Adicionar campo de observações gerais ao laudo
ALTER TABLE reports ADD COLUMN IF NOT EXISTS observations TEXT;

-- Adicionar campo de observações específicas a cada microrganismo
ALTER TABLE microorganisms ADD COLUMN IF NOT EXISTS observations TEXT;

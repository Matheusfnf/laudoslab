-- Adiciona coluna de sequencial na tabela do catálogo
ALTER TABLE public.catalog_products 
ADD COLUMN IF NOT EXISTS last_sequential_number INTEGER NOT NULL DEFAULT 0;

-- Observação: Produtos novos já virão com default 0 
-- Aos já existentes, o banco preencherá retroativamente com 0

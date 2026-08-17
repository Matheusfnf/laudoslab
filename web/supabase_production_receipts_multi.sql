-- Migração: múltiplos comprovantes por Pedido de Produção (até 3)
-- ADITIVA: não faz DROP, DELETE nem altera dados existentes.
-- Autorizado por Matheus em 2026-08-17.

-- Nova coluna com a lista de comprovantes.
-- A coluna antiga receipt_image_url CONTINUA existindo e continua sendo
-- preenchida com o 1º comprovante, para não quebrar pedidos já cadastrados
-- nem qualquer consulta que já dependa dela.
ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS receipt_image_urls JSONB;

-- Backfill: pedidos antigos passam a ter a lista com o comprovante único que já possuem.
UPDATE public.production_orders
SET receipt_image_urls = jsonb_build_array(receipt_image_url)
WHERE receipt_image_url IS NOT NULL
  AND receipt_image_urls IS NULL;

-- Garantia no banco do limite de 3 comprovantes.
-- (O app já valida, isso é só a rede de segurança.)
ALTER TABLE public.production_orders
DROP CONSTRAINT IF EXISTS production_orders_receipt_urls_max_3;

ALTER TABLE public.production_orders
ADD CONSTRAINT production_orders_receipt_urls_max_3
CHECK (
    receipt_image_urls IS NULL
    OR (
        jsonb_typeof(receipt_image_urls) = 'array'
        AND jsonb_array_length(receipt_image_urls) BETWEEN 1 AND 3
    )
);

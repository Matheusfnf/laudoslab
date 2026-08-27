-- Migração: classe do produto (Cepa / Metabólito / Meio de Cultura)
-- Autorizado por Matheus em 2026-08-27.
--
-- >>> A seção 3 desta migração falhou parcialmente na execução real: o DELETE
-- >>> não casou com a linha e o INSERT do 'BAC' foi pulado pela guarda.
-- >>> Corrigido por supabase_product_category_fix.sql — rode aquele arquivo
-- >>> depois deste. Este ficou como registro do que foi aplicado.
--
-- ATENÇÃO — esta migração NÃO é 100% aditiva. Além dos ADD COLUMN, ela contém
-- um DELETE de UMA linha, autorizado explicitamente: o produto "Meio de Cultura"
-- (sigla BAC) cadastrado à mão, substituído pelos dois definitivos (seção 3).
-- Nenhum DROP de tabela e nenhum TRUNCATE.
--
-- Modelo de DOIS EIXOS:
--   category (novo) -> classe comercial: cepa | metabolito | meio_cultura
--   type   (existente) -> grupo biológico: bacteria | fungus | other
-- Um "Ativador X MB" fica category='metabolito' E continua com type='bacteria',
-- ou seja, nenhum dado existente muda de significado.

-- ==========================================================
-- 1. Classe no catálogo de produtos
-- ==========================================================
ALTER TABLE public.catalog_products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'cepa';

ALTER TABLE public.catalog_products
DROP CONSTRAINT IF EXISTS catalog_products_category_check;

ALTER TABLE public.catalog_products
ADD CONSTRAINT catalog_products_category_check
CHECK (category IN ('cepa', 'metabolito', 'meio_cultura'));

-- ==========================================================
-- 2. Backfill: produtos "... MB" viram metabólito
-- ==========================================================
-- CONFERÊNCIA (opcional): rode este SELECT ANTES do UPDATE abaixo para ver
-- exatamente quais produtos serão marcados como metabólito. Ele só lê, não altera.
--
--   SELECT name, acronym,
--          CASE WHEN name ILIKE '%MB' OR name ILIKE '%MB %' OR acronym ILIKE '%MB'
--               THEN '-> METABOLITO' ELSE 'continua cepa' END AS resultado
--   FROM public.catalog_products
--   ORDER BY resultado, name;
--
-- Conferido com o Matheus em 2026-08-27: a regra pega exatamente os dois
-- produtos MB (CHS-MB e STM-MB), pelo sufixo da sigla, e mantém os pares
-- "(CEPA)" (CH-S e STM) como cepa. Nenhum falso positivo.
UPDATE public.catalog_products
SET category = 'metabolito'
WHERE category = 'cepa'
  AND (name ILIKE '%MB' OR name ILIKE '%MB %' OR acronym ILIKE '%MB');

-- ==========================================================
-- 3. Os dois meios de cultura
-- ==========================================================
-- Remove o "Meio de Cultura" (sigla BAC) que havia sido cadastrado à mão,
-- para dar lugar aos dois produtos definitivos e evitar sigla BAC duplicada.
-- Autorizado por Matheus em 2026-08-27.
-- Conferido antes: nenhum registro em production_order_items referencia esse
-- produto, então a remoção não deixa item nem lote órfão.
DELETE FROM public.catalog_products
WHERE name = 'Meio de Cultura'
  AND acronym = 'BAC';

-- As siglas BAC e FUN são o que aparece na etiqueta impressa:
-- "MEIO DE CULTURA BAC" e "MEIO DE CULTURA FUN".
-- Os INSERTs são idempotentes (guardados pela sigla): rodar de novo não duplica.
INSERT INTO public.catalog_products (name, acronym, type, category, shelf_life_months)
SELECT 'Meio de cultura para bactérias', 'BAC', 'other', 'meio_cultura', 6
WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_products WHERE acronym = 'BAC'
);

INSERT INTO public.catalog_products (name, acronym, type, category, shelf_life_months)
SELECT 'Meio de cultura para fungos', 'FUN', 'other', 'meio_cultura', 6
WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_products WHERE acronym = 'FUN'
);

-- ==========================================================
-- 4. Classe gravada junto do item do pedido
-- ==========================================================
-- É isso que faz a informação chegar na produção: o item guarda a classe que
-- tinha no momento do pedido, e não muda se o catálogo for reclassificado depois.
ALTER TABLE public.production_order_items
ADD COLUMN IF NOT EXISTS product_category TEXT;

-- Backfill dos itens já existentes, casando pelo nome do produto.
-- Preenche apenas o que está nulo; não sobrescreve nada.
UPDATE public.production_order_items i
SET product_category = c.category
FROM public.catalog_products c
WHERE i.product_name = c.name
  AND i.product_category IS NULL;

-- Itens antigos cujo produto não existe mais no catálogo ficam como 'cepa',
-- que é o que eles eram antes desta migração.
UPDATE public.production_order_items
SET product_category = 'cepa'
WHERE product_category IS NULL;

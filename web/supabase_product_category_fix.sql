-- Correção da migração supabase_product_category.sql (seção 3)
-- Autorizado por Matheus em 2026-08-27.
--
-- O QUE DEU ERRADO
-- O DELETE da seção 3 não casou com a linha do produto "Meio de Cultura"
-- (provável diferença de espaço/caixa no nome). Como a linha sobreviveu, o
-- INSERT seguinte foi pulado pela guarda NOT EXISTS (acronym = 'BAC') e o
-- produto ficou com o default category = 'cepa'. O 'FUN' entrou correto.
--
-- ESTA CORREÇÃO não apaga nada: apenas ajusta a linha que já existe, casando
-- pela sigla (que é exata) em vez do nome. É idempotente — rodar de novo não
-- muda mais nada. Conferido antes: nenhum registro em production_order_items
-- referencia esse produto, então renomear não quebra vínculo nenhum.

-- 1. Corrige a classe e o grupo dos dois meios de cultura
UPDATE public.catalog_products
SET category = 'meio_cultura',
    type = 'other'
WHERE acronym IN ('BAC', 'FUN');

-- 2. Padroniza o nome do BAC para ficar igual ao par do FUN
UPDATE public.catalog_products
SET name = 'Meio de cultura para bactérias'
WHERE acronym = 'BAC'
  AND name <> 'Meio de cultura para bactérias';

-- 3. Conferência — deve devolver exatamente 2 linhas, ambas meio_cultura/other
SELECT name, acronym, category, type
FROM public.catalog_products
WHERE acronym IN ('BAC', 'FUN')
ORDER BY acronym;

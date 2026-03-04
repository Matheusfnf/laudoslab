-- Migração para adicionar detalhes ao Pedido de Produção
-- Isso adiciona os novos campos solicitados na tabela existente sem afetar os dados atuais.

ALTER TABLE public.production_orders 
ADD COLUMN requester_name VARCHAR(255),
ADD COLUMN order_date DATE,
ADD COLUMN estimated_completion_date DATE,
ADD COLUMN receipt_image_url TEXT;

-- Criação do Bucket de Storage para imagens dos pedidos em caderno (caso não exista)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('production-receipts', 'production-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Definir políticas para permitir acesso público de leitura e upload pelo usuário
CREATE POLICY "Permitir leitura pública 1p0a8o_0" ON storage.objects FOR SELECT USING (bucket_id = 'production-receipts');
CREATE POLICY "Permitir inserção autenticada 1p0a8o_0" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'production-receipts');
CREATE POLICY "Permitir atualização autenticada 1p0a8o_0" ON storage.objects FOR UPDATE USING (bucket_id = 'production-receipts');
CREATE POLICY "Permitir exclusão autenticada 1p0a8o_0" ON storage.objects FOR DELETE USING (bucket_id = 'production-receipts');

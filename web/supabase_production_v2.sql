-- Módulo de Produção V2: Separação de Pedidos e Lotes
-- Conforme autorizado, apagamos as tabelas antigas de teste para criar o novo modelo estruturado.

DROP TABLE IF EXISTS public.production_batches;
DROP TABLE IF EXISTS public.production_order_items;
DROP TABLE IF EXISTS public.production_orders;

-- Tabela principal de Pedidos de Produção (Apenas dados gerais do Pedido Mãe)
CREATE TABLE public.production_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Produtos solicitados no Pedido
CREATE TABLE public.production_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity_requested NUMERIC NOT NULL,
    unit VARCHAR(10) DEFAULT 'UN' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Lotes de Produção (Fração de um item para entra no Kanban)
CREATE TABLE public.production_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.production_order_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(255) NOT NULL,
    quantity_produced NUMERIC NOT NULL,
    manufacture_date DATE,
    expiration_date DATE,
    status VARCHAR(50) DEFAULT 'todo' NOT NULL, -- todo, in_progress, done
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando RLS e Políticas
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos autenticados" ON public.production_orders FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos autenticados" ON public.production_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos autenticados" ON public.production_orders FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos autenticados" ON public.production_orders FOR DELETE USING (true);

CREATE POLICY "Permitir leitura para todos autenticados" ON public.production_order_items FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos autenticados" ON public.production_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos autenticados" ON public.production_order_items FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos autenticados" ON public.production_order_items FOR DELETE USING (true);

CREATE POLICY "Permitir leitura para todos autenticados" ON public.production_batches FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos autenticados" ON public.production_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos autenticados" ON public.production_batches FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos autenticados" ON public.production_batches FOR DELETE USING (true);

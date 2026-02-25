-- Módulo de Produção
-- Atenção: Apenas criando novas tabelas, NÃO fazendo DELETE ou DROP de tabelas existentes (Rule: Segurança de Dados)

-- Tabela principal de Pedidos de Produção
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    batch VARCHAR(255),
    manufacture_date DATE,
    expiration_date DATE,
    status VARCHAR(50) DEFAULT 'todo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Produtos (Itens) vinculados aos Pedidos
CREATE TABLE IF NOT EXISTS public.production_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC NOT NULL,
    unit VARCHAR(10) DEFAULT 'UN' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando RLS (Row Level Security) - Por enquanto, permitindo acesso total para uso interno
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Temporárias para desenvolvimento rápido, ajuste em produção)
CREATE POLICY "Permitir leitura para todos autenticados" ON public.production_orders FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos autenticados" ON public.production_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos autenticados" ON public.production_orders FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos autenticados" ON public.production_orders FOR DELETE USING (true);

CREATE POLICY "Permitir leitura para todos autenticados" ON public.production_order_items FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos autenticados" ON public.production_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos autenticados" ON public.production_order_items FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos autenticados" ON public.production_order_items FOR DELETE USING (true);

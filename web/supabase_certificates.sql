-- Script para criação das tabelas de Certificado de Controle de Qualidade
-- Seguindo a regra absoluta de não dar DROP em tabelas de produção!

-- 1. Tabela Principal do Certificado
CREATE TABLE IF NOT EXISTS public.production_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE CASCADE,
    certificate_number VARCHAR(255),
    emission_date DATE,
    product_name VARCHAR(255),
    product_code VARCHAR(255),
    brand VARCHAR(255) DEFAULT 'Proativa - Soluções Biológicas',
    batch_number VARCHAR(255),
    manufacture_date DATE,
    expiration_date DATE,
    batch_volume VARCHAR(255),
    presentation VARCHAR(255),
    storage_conditions VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela Filha: Microrganismos analisados no Certificado
CREATE TABLE IF NOT EXISTS public.certificate_microorganisms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_id UUID REFERENCES public.production_certificates(id) ON DELETE CASCADE,
    name VARCHAR(255),
    exponential_value VARCHAR(255)
);

-- 3. Tabela Filha: Características Físico-Químicas analisadas
CREATE TABLE IF NOT EXISTS public.certificate_physicochemical (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_id UUID REFERENCES public.production_certificates(id) ON DELETE CASCADE,
    characteristic VARCHAR(255),
    result_value VARCHAR(255)
);

-- Habilitando RLS (Row Level Security) 
ALTER TABLE public.production_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_microorganisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_physicochemical ENABLE ROW LEVEL SECURITY;

-- Aplicando Políticas Publicas para Autenticados (Desenvolvimento/Uso Interno ProativaLab)
CREATE POLICY "Permitir leitura total certificates" ON public.production_certificates FOR SELECT USING (true);
CREATE POLICY "Permitir inserção total certificates" ON public.production_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização total certificates" ON public.production_certificates FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão total certificates" ON public.production_certificates FOR DELETE USING (true);

CREATE POLICY "Permitir leitura total cmicro" ON public.certificate_microorganisms FOR SELECT USING (true);
CREATE POLICY "Permitir inserção total cmicro" ON public.certificate_microorganisms FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização total cmicro" ON public.certificate_microorganisms FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão total cmicro" ON public.certificate_microorganisms FOR DELETE USING (true);

CREATE POLICY "Permitir leitura total cphysico" ON public.certificate_physicochemical FOR SELECT USING (true);
CREATE POLICY "Permitir inserção total cphysico" ON public.certificate_physicochemical FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização total cphysico" ON public.certificate_physicochemical FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão total cphysico" ON public.certificate_physicochemical FOR DELETE USING (true);

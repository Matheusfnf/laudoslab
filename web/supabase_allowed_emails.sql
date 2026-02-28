-- ==========================================
-- PROATIVA LAB - WHITELIST DE CADASTRO
-- ==========================================
-- Criação da tabela de e-mails permitidos e
-- do gatilho (Trigger) que bloqueia cadastros
-- não autorizados.

-- 1. Cria a tabela de e-mails permitidos (Whitelist)
CREATE TABLE IF NOT EXISTS public.allowed_emails (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativa RLS para que e-mails nao vazem na internet
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Politica: apenas autenticados podem ver a lista (opcional, pode deixar restrito apenas ao admin DB)
CREATE POLICY "Permitir leitura de allowed_emails" 
ON public.allowed_emails FOR SELECT 
TO authenticated USING (true);

-- 2. Cria a função que verifica o e-mail no registro
CREATE OR REPLACE FUNCTION public.check_allowed_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se o e-mail que está tentando se cadastrar existe na tabela allowed_emails
    IF NOT EXISTS (
        SELECT 1 FROM public.allowed_emails WHERE email = NEW.email
    ) THEN
        -- Se não existir, lança uma exceção (bloqueia o cadastro)
        RAISE EXCEPTION 'Acesso Negado: Crie uma conta apenas com um e-mail previamente autorizado pela Administração do Laboratório.';
    END IF;
    
    -- Se existir, deixa passar
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associa a função como um Gatilho ANTES do INSERT na tabela auth.users (do Supabase Auth oficial)
DROP TRIGGER IF EXISTS "tr_check_allowed_email" ON auth.users;

CREATE TRIGGER "tr_check_allowed_email"
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.check_allowed_email();

-- (Opcional) Dica: Para inserir o seu e-mail como o primeiro administrador autorizado:
-- INSERT INTO public.allowed_emails (email) VALUES ('matheusfortunatoaw@hotmail.com');

-- 1. Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The admin user will be inserted manually by the database administrator.
-- Example: INSERT INTO app_users (name, password) VALUES ('Matheus', 'minhasenha');

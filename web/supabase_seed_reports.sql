-- Migration: Add Seed Report Columns
-- Adiciona colunas para suportar Laudos de Sementes, Solo e Raízes sem quebrar Laudos de Microorganismos

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'micro',
ADD COLUMN IF NOT EXISTS analytical_matrix TEXT,
ADD COLUMN IF NOT EXISTS matrix_results JSONB;

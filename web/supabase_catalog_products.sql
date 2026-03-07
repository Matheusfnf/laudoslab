-- Table for Product Catalog
CREATE TABLE public.catalog_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    acronym VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bacteria', 'fungus', 'other')),
    shelf_life_months INTEGER NOT NULL DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users on catalog"
    ON public.catalog_products FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow write access to all authenticated users
CREATE POLICY "Allow all actions to authenticated users on catalog"
    ON public.catalog_products FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert Initial Data (Bactérias = 6 months, Fungos = 12 months)
INSERT INTO public.catalog_products (name, acronym, type, shelf_life_months) VALUES
('Priestia aryabhattai', 'PR-A', 'bacteria', 6),
('Priestia megaterium', 'PR-M', 'bacteria', 6),
('Bacillus subtilis (fungicida)', 'BA-SF', 'bacteria', 6),
('Bacillus subtilis (nematicida)', 'BA-SN', 'bacteria', 6),
('Bacillus subtilis', 'BSU', 'bacteria', 6),
('Bacillus amyloliquefaciens (nematicida)', 'BA-AN', 'bacteria', 6),
('Bacillus amyloliquefaciens (fungicida)', 'BA-AF', 'bacteria', 6),
('Bacillus amyloliquefaciens', 'BAM', 'bacteria', 6),
('Bacillus pumilus (nematicida)', 'BA-PN', 'bacteria', 6),
('Bacillus pumilus (fungicida)', 'BA-PF', 'bacteria', 6),
('Bacillus pumilus', 'BPU', 'bacteria', 6),
('Bacillus velezensis (nematicida)', 'BA-VN', 'bacteria', 6),
('Bacillus velezensis (fungicida)', 'BA-VF', 'bacteria', 6),
('Bacillus velezensis', 'BVE', 'bacteria', 6),
('Bacillus thuringiensis aizawai', 'BA-TA', 'bacteria', 6),
('Bacillus thuringiensis kurstaki', 'BA-TK', 'bacteria', 6),
('Bacillus methylotrophicus (nematicida)', 'BA-MN', 'bacteria', 6),
('Chromobacterium subtsugae', 'CH-S', 'bacteria', 6),
('Saccharopolyspora spinosa', 'SA-S', 'bacteria', 6),
('Trichoderma asperellum', 'TR-A', 'fungus', 12),
('Trichoderma harzianum', 'TR-H', 'fungus', 12),
('Beauveria bassiana', 'BE-B', 'fungus', 12),
('Cordyceps javanica (Isaria)', 'IS-F', 'fungus', 12),
('Metarhizium anisopliae', 'ME-A', 'fungus', 12),
('Pochonia chlamydosporia', 'PO-C', 'fungus', 12),
('Purpureocillium lilacinum (Peacilomyces)', 'PU-L', 'fungus', 12);

-- Enable public read access for reports, clients and microorganisms so they can be viewed via the QR code route
DROP POLICY IF EXISTS "Public read access for reports" ON public.reports;
CREATE POLICY "Public read access for reports" 
ON public.reports 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read access for microorganisms" ON public.microorganisms;
CREATE POLICY "Public read access for microorganisms" 
ON public.microorganisms 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read access for clients" ON public.clients;
CREATE POLICY "Public read access for clients" 
ON public.clients 
FOR SELECT 
USING (true);

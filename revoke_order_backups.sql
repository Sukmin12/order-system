-- Revoke anon permissions for order_backups (run in Supabase SQL Editor)
REVOKE INSERT ON public.order_backups FROM anon;
REVOKE USAGE ON SEQUENCE public.order_backups_id_seq FROM anon;

-- Optional: drop an overly-permissive policy if you created one for anon
DROP POLICY IF EXISTS allow_anon_insert_order_backups ON public.order_backups;

-- ============================================
-- Migration 010: Função create_tenant (solução definitiva RLS)
-- Cria tenant + membership em uma chamada, sem depender de políticas RLS.
-- ============================================

-- Função que cria tenant e membership com privilégios elevados (bypass RLS).
-- Só executa se auth.uid() estiver definido (usuário autenticado).
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_cnpj TEXT DEFAULT NULL
)
RETURNS SETOF public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_tenant_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Garantir que o usuário existe em public.users (evita FK em tenant_memberships)
  INSERT INTO public.users (id, email, full_name, created_at)
  SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), NOW()
  FROM auth.users WHERE id = v_uid
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenants (name, slug, cnpj, created_at, updated_at)
  VALUES (p_name, p_slug, p_cnpj, NOW(), NOW())
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_uid, 'admin'::public.user_role);

  RETURN QUERY SELECT * FROM public.tenants WHERE id = v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.create_tenant(TEXT, TEXT, TEXT) IS
  'Cria um novo tenant (empresa) e associa o usuário autenticado como admin. Bypass RLS para evitar 403 na criação da primeira empresa.';

-- Garantir que a role authenticated pode executar a função
GRANT EXECUTE ON FUNCTION public.create_tenant(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant(TEXT, TEXT, TEXT) TO service_role;

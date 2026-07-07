-- Verificacion posterior a la migracion MICA app -> prestador -> presupuesto -> comision -> WhatsApp.
-- No modifica datos.

select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('contact_unlocks', 'app_contact_visibility_rules')
order by table_name;

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'nuevaOferta' and column_name in ('app_cliente_id', 'app_chat_id', 'ciudad', 'provincia', 'source', 'metadata', 'updated_at'))
    or (table_name = 'presupuestos' and column_name in ('app_chat_id', 'cliente_id', 'comision_pagada', 'contacto_habilitado', 'commission_amount', 'payment_provider', 'metadata'))
    or table_name in ('contact_unlocks', 'app_contact_visibility_rules')
  )
order by table_name, ordinal_position;

select
  scope,
  province,
  city,
  enabled,
  allow_without_commission,
  reason
from public.app_contact_visibility_rules
where scope = 'provider_contact'
order by created_at desc;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_mica_app_request',
    'get_provider_contact_access',
    'mark_presupuesto_contact_unlocked'
  )
order by p.proname;


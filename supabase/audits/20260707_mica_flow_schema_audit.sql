-- Auditoria previa para flujo MICA app -> prestador -> presupuesto -> comision -> WhatsApp.
-- Ejecutar en Supabase SQL Editor antes de correr la migracion propuesta.
-- No modifica datos ni estructura.

select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'nuevaOferta',
    'presupuestos',
    'usuarios',
    'chats',
    'mensajes',
    'contact_unlocks',
    'app_contact_visibility_rules'
  )
order by table_name;

select
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'nuevaOferta',
    'presupuestos',
    'usuarios',
    'chats',
    'mensajes',
    'contact_unlocks',
    'app_contact_visibility_rules'
  )
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'nuevaOferta',
    'presupuestos',
    'contact_unlocks',
    'app_contact_visibility_rules'
  )
order by tablename, policyname;

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


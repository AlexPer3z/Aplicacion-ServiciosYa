-- Backfill opcional para cuentas Catamarca con servicios publicados.
-- IMPORTANTE: revisar primero supabase/audits/20260707_catamarca_worker_backfill_audit.sql.
-- Esta migracion promueve a worker solo usuarios de Catamarca con servicios publicados,
-- celular cargado y categorias derivables desde public.servicios.

with servicios_por_usuario as (
  select
    s.user_id,
    array_agg(distinct nullif(trim(s.categoria), '') order by nullif(trim(s.categoria), '')) filter (
      where nullif(trim(s.categoria), '') is not null
    ) as categorias_servicios
  from public.servicios s
  where s.user_id is not null
  group by s.user_id
),
candidatos as (
  select
    u.id,
    sp.categorias_servicios
  from public.usuarios u
  join servicios_por_usuario sp on sp.user_id = u.id::text
  where lower(trim(coalesce(u.provincia, ''))) like '%catamarca%'
    and lower(trim(coalesce(u.rol::text, ''))) in ('user', 'worker')
    and u.celular is not null
    and sp.categorias_servicios is not null
    and cardinality(sp.categorias_servicios) > 0
    and (
      u.rol::text <> 'worker'
      or u."perfilPublico" is distinct from true
      or u.categoria is null
      or cardinality(u.categoria) = 0
    )
)
update public.usuarios u
set
  rol = case
    when lower(trim(coalesce(u.rol::text, ''))) = 'user' then 'worker'::user_role
    else u.rol
  end,
  "perfilPublico" = true,
  perfil_completo = true,
  categoria = coalesce(nullif(u.categoria, '{}'::text[]), c.categorias_servicios),
  actualizado_en = now()
from candidatos c
where u.id = c.id;

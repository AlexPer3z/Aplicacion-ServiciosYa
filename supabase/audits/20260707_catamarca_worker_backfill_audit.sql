-- Auditoria de cuentas Catamarca con servicios publicados pero perfil de prestador incompleto.
-- No modifica datos. Sirve para decidir un backfill controlado.

with servicios_por_usuario as (
  select
    s.user_id,
    count(*) as servicios_count,
    array_agg(distinct nullif(trim(s.categoria), '') order by nullif(trim(s.categoria), '')) filter (
      where nullif(trim(s.categoria), '') is not null
    ) as categorias_servicios,
    bool_or(coalesce(s.estado, '') in ('''activo''', 'activo')) as tiene_servicio_activo,
    bool_or(coalesce(s.aceptado, false)) as tiene_servicio_aceptado
  from public.servicios s
  where s.user_id is not null
  group by s.user_id
)
select
  u.id,
  u.nombre,
  u.email,
  u.celular,
  u.rol,
  u."perfilPublico",
  u.perfil_completo,
  u.dni_verificado,
  u.ciudad,
  u.provincia,
  u.categoria as categorias_perfil,
  sp.categorias_servicios,
  sp.servicios_count,
  sp.tiene_servicio_activo,
  sp.tiene_servicio_aceptado,
  array_remove(array[
    case when u.rol::text <> 'worker' then 'rol_no_worker' end,
    case when u."perfilPublico" is distinct from true then 'perfil_no_publico' end,
    case when u.categoria is null or cardinality(u.categoria) = 0 then 'sin_categoria_perfil' end,
    case when nullif(trim(coalesce(u.provincia, '')), '') is null then 'sin_provincia' end,
    case when nullif(trim(coalesce(u.ciudad, '')), '') is null then 'sin_ciudad' end,
    case when u.celular is null then 'sin_celular' end
  ], null) as faltantes_para_operar
from public.usuarios u
join servicios_por_usuario sp on sp.user_id = u.id::text
where lower(trim(coalesce(u.provincia, ''))) like '%catamarca%'
  and lower(trim(coalesce(u.rol::text, ''))) in ('user', 'worker')
  and (
    u.rol::text <> 'worker'
    or u."perfilPublico" is distinct from true
    or u.categoria is null
    or cardinality(u.categoria) = 0
    or nullif(trim(coalesce(u.ciudad, '')), '') is null
    or u.celular is null
  )
order by sp.servicios_count desc, u.creado_en desc nulls last;

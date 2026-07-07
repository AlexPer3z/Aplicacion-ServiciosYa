-- Auditoria Web/MICA: usuarios de Catamarca con servicios publicados y su estado en sy_perfiles.
-- No modifica datos.

with servicios_por_usuario as (
  select
    s.user_id,
    count(*) as servicios_count,
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
    u.nombre,
    u.email,
    u.celular::text as telefono,
    u.rol as app_rol,
    u."perfilPublico",
    u.ciudad,
    u.provincia,
    coalesce(nullif(u.categoria, '{}'::text[]), sp.categorias_servicios) as categorias_operativas,
    sp.servicios_count
  from public.usuarios u
  join servicios_por_usuario sp on sp.user_id = u.id::text
  where lower(trim(coalesce(u.provincia, ''))) like '%catamarca%'
    and lower(trim(coalesce(u.rol::text, ''))) in ('user', 'worker')
    and u.celular is not null
    and coalesce(nullif(u.categoria, '{}'::text[]), sp.categorias_servicios) is not null
)
select
  c.*,
  sy.id as sy_perfil_id,
  sy.rol as sy_rol,
  sy.oficios as sy_oficios,
  sy.zona_frecuente as sy_zona_frecuente,
  array_remove(array[
    case when sy.id is null then 'sin_sy_perfil' end,
    case when sy.id is not null and sy.rol <> 'prestador' then 'sy_rol_no_prestador' end,
    case
      when sy.id is not null
        and (
          sy.oficios is null
          or jsonb_typeof(sy.oficios) <> 'array'
          or jsonb_array_length(sy.oficios) = 0
        )
      then 'sy_sin_oficios'
    end
  ], null) as faltantes_web_mica
from candidatos c
left join public.sy_perfiles sy on regexp_replace(coalesce(sy.telefono, ''), '[^0-9]', '', 'g') = regexp_replace(c.telefono, '[^0-9]', '', 'g')
where sy.id is null
  or sy.rol <> 'prestador'
  or sy.oficios is null
  or jsonb_typeof(sy.oficios) <> 'array'
  or jsonb_array_length(sy.oficios) = 0
order by c.servicios_count desc, c.nombre;

-- Flujo MICA app -> prestador -> presupuesto -> comision -> WhatsApp.
-- Idempotente: no borra datos, no renombra columnas y no cambia tipos existentes.
-- Recomendado: correr primero supabase/audits/20260707_mica_flow_schema_audit.sql.

create extension if not exists pgcrypto;

create table if not exists public."nuevaOferta" (
  id bigserial primary key,
  created_at timestamp default now(),
  cliente_telefono text,
  nombre_cliente text,
  categoria text,
  descripcion text,
  zona text,
  estado text default 'pendiente',
  paso integer default 1,
  media_url text,
  video_urls text,
  media_descripcion text,
  historial_conversacion text
);

alter table public."nuevaOferta"
  add column if not exists app_cliente_id uuid,
  add column if not exists app_chat_id uuid,
  add column if not exists ciudad text,
  add column if not exists provincia text,
  add column if not exists modo_agente boolean default false,
  add column if not exists source text not null default 'mica',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists nueva_oferta_app_cliente_idx
  on public."nuevaOferta" (app_cliente_id, created_at desc)
  where app_cliente_id is not null;

create index if not exists nueva_oferta_estado_categoria_idx
  on public."nuevaOferta" (estado, categoria, created_at desc);

create table if not exists public.presupuestos (
  id bigserial primary key,
  oferta_id bigint,
  trabajador_id bigint,
  monto numeric,
  tiempo_entrega integer,
  score numeric,
  estado text default 'activo',
  created_at timestamp default now(),
  descripcion text,
  trabajador_uuid uuid,
  estado_confirmacion text not null default 'pendiente',
  horarios_disponibles text,
  property_id uuid,
  unit_id uuid,
  payment_link text,
  payment_preference_id text,
  payment_id text,
  senia numeric,
  paid_at timestamp
);

alter table public.presupuestos
  add column if not exists app_chat_id uuid,
  add column if not exists cliente_id uuid,
  add column if not exists comision_pagada boolean not null default false,
  add column if not exists contacto_habilitado boolean not null default false,
  add column if not exists commission_amount numeric,
  add column if not exists payment_provider text,
  add column if not exists payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists presupuestos_oferta_idx
  on public.presupuestos (oferta_id, created_at desc);

create index if not exists presupuestos_trabajador_idx
  on public.presupuestos (trabajador_uuid, created_at desc)
  where trabajador_uuid is not null;

create index if not exists presupuestos_cliente_idx
  on public.presupuestos (cliente_id, created_at desc)
  where cliente_id is not null;

create table if not exists public.contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unlocked_at timestamptz,
  cliente_id uuid not null,
  trabajador_id uuid,
  oferta_id text,
  presupuesto_id bigint,
  chat_id uuid,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  reason text not null default 'commission_payment' check (reason in ('commission_payment', 'regional_exception', 'manual_admin')),
  amount_total numeric,
  commission_amount numeric,
  payment_provider text,
  payment_id text,
  provincia text,
  ciudad text,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists contact_unlocks_approved_presupuesto_unique_idx
  on public.contact_unlocks (cliente_id, presupuesto_id)
  where presupuesto_id is not null and status = 'approved';

create index if not exists contact_unlocks_lookup_idx
  on public.contact_unlocks (cliente_id, trabajador_id, oferta_id, status);

create table if not exists public.app_contact_visibility_rules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  enabled boolean not null default true,
  scope text not null default 'provider_contact' check (scope in ('provider_contact')),
  province text not null,
  city text,
  allow_without_commission boolean not null default false,
  reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists app_contact_visibility_rules_scope_zone_idx
  on public.app_contact_visibility_rules (scope, lower(trim(province)), lower(trim(coalesce(city, ''))));

insert into public.app_contact_visibility_rules (
  scope,
  province,
  city,
  allow_without_commission,
  reason,
  metadata
)
select
  'provider_contact',
  'Catamarca',
  null,
  true,
  'Excepcion operativa para liberar datos de prestadores en Catamarca',
  '{"created_by":"migration_20260707120000"}'::jsonb
where not exists (
  select 1
  from public.app_contact_visibility_rules
  where scope = 'provider_contact'
    and lower(trim(province)) = 'catamarca'
    and city is null
);

alter table public.contact_unlocks enable row level security;
alter table public.app_contact_visibility_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_unlocks'
      and policyname = 'contact_unlocks_service_role_all'
  ) then
    create policy contact_unlocks_service_role_all
      on public.contact_unlocks
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_unlocks'
      and policyname = 'contact_unlocks_users_select_own'
  ) then
    create policy contact_unlocks_users_select_own
      on public.contact_unlocks
      for select
      to authenticated
      using (cliente_id = auth.uid() or trabajador_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_contact_visibility_rules'
      and policyname = 'app_contact_visibility_rules_service_role_all'
  ) then
    create policy app_contact_visibility_rules_service_role_all
      on public.app_contact_visibility_rules
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_contact_visibility_rules'
      and policyname = 'app_contact_visibility_rules_authenticated_select'
  ) then
    create policy app_contact_visibility_rules_authenticated_select
      on public.app_contact_visibility_rules
      for select
      to authenticated
      using (enabled = true);
  end if;
end $$;

create or replace function public.create_mica_app_request(
  p_categoria text,
  p_descripcion text,
  p_zona text,
  p_nombre_cliente text default null,
  p_cliente_telefono text default null,
  p_ciudad text default null,
  p_provincia text default null,
  p_historial jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns table (ok boolean, oferta_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oferta_id text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if nullif(trim(coalesce(p_categoria, '')), '') is null then
    raise exception 'Falta categoria';
  end if;

  if nullif(trim(coalesce(p_descripcion, '')), '') is null then
    raise exception 'Falta descripcion';
  end if;

  insert into public."nuevaOferta" (
    app_cliente_id,
    nombre_cliente,
    cliente_telefono,
    categoria,
    descripcion,
    zona,
    ciudad,
    provincia,
    estado,
    paso,
    source,
    modo_agente,
    historial_conversacion,
    metadata,
    created_at,
    updated_at
  )
  values (
    auth.uid(),
    nullif(trim(coalesce(p_nombre_cliente, '')), ''),
    nullif(trim(coalesce(p_cliente_telefono, '')), ''),
    trim(p_categoria),
    trim(p_descripcion),
    nullif(trim(coalesce(p_zona, '')), ''),
    nullif(trim(coalesce(p_ciudad, '')), ''),
    nullif(trim(coalesce(p_provincia, '')), ''),
    'recolectando',
    1,
    'mica_app',
    true,
    coalesce(p_historial, '[]'::jsonb)::text,
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  returning id::text into v_oferta_id;

  return query select true, v_oferta_id;
end;
$$;

create or replace function public.get_provider_contact_access(
  p_cliente_id uuid default null,
  p_trabajador_id uuid default null,
  p_presupuesto_id bigint default null,
  p_oferta_id text default null,
  p_provincia text default null,
  p_ciudad text default null
)
returns table (
  can_view boolean,
  reason text,
  unlock_id uuid,
  requires_payment boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid := coalesce(p_cliente_id, auth.uid());
  v_unlock_id uuid;
  v_provincia text := nullif(trim(coalesce(p_provincia, '')), '');
  v_ciudad text := nullif(trim(coalesce(p_ciudad, '')), '');
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if v_cliente_id is distinct from auth.uid() and auth.role() <> 'service_role' then
    raise exception 'No autorizado';
  end if;

  if (v_provincia is null or v_ciudad is null) and p_trabajador_id is not null then
    select
      coalesce(v_provincia, u.provincia),
      coalesce(v_ciudad, u.ciudad)
    into v_provincia, v_ciudad
    from public.usuarios u
    where u.id = p_trabajador_id;
  end if;

  select cu.id
    into v_unlock_id
  from public.contact_unlocks cu
  where cu.cliente_id = v_cliente_id
    and cu.status = 'approved'
    and (p_trabajador_id is null or cu.trabajador_id = p_trabajador_id)
    and (p_presupuesto_id is null or cu.presupuesto_id = p_presupuesto_id)
    and (p_oferta_id is null or cu.oferta_id = p_oferta_id)
  order by cu.unlocked_at desc nulls last, cu.created_at desc
  limit 1;

  if v_unlock_id is not null then
    return query select true, 'commission_payment'::text, v_unlock_id, false;
    return;
  end if;

  if exists (
    select 1
    from public.app_contact_visibility_rules r
    where r.enabled = true
      and r.scope = 'provider_contact'
      and r.allow_without_commission = true
      and lower(trim(r.province)) = lower(trim(coalesce(v_provincia, '')))
      and (r.city is null or lower(trim(r.city)) = lower(trim(coalesce(v_ciudad, ''))))
      and (r.starts_at is null or r.starts_at <= now())
      and (r.ends_at is null or r.ends_at > now())
  ) then
    return query select true, 'regional_exception'::text, null::uuid, false;
    return;
  end if;

  return query select false, 'commission_required'::text, null::uuid, true;
end;
$$;

create or replace function public.mark_presupuesto_contact_unlocked(
  p_presupuesto_id bigint,
  p_cliente_id uuid,
  p_trabajador_id uuid,
  p_oferta_id text default null,
  p_chat_id uuid default null,
  p_amount_total numeric default null,
  p_commission_amount numeric default null,
  p_payment_provider text default null,
  p_payment_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unlock_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Solo service_role puede confirmar desbloqueos de contacto';
  end if;

  insert into public.contact_unlocks (
    cliente_id,
    trabajador_id,
    oferta_id,
    presupuesto_id,
    chat_id,
    status,
    reason,
    amount_total,
    commission_amount,
    payment_provider,
    payment_id,
    unlocked_at,
    metadata
  )
  values (
    p_cliente_id,
    p_trabajador_id,
    p_oferta_id,
    p_presupuesto_id,
    p_chat_id,
    'approved',
    'commission_payment',
    p_amount_total,
    p_commission_amount,
    p_payment_provider,
    p_payment_id,
    now(),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (cliente_id, presupuesto_id)
    where presupuesto_id is not null and status = 'approved'
  do update set
    trabajador_id = excluded.trabajador_id,
    oferta_id = excluded.oferta_id,
    chat_id = excluded.chat_id,
    amount_total = excluded.amount_total,
    commission_amount = excluded.commission_amount,
    payment_provider = excluded.payment_provider,
    payment_id = excluded.payment_id,
    unlocked_at = now(),
    metadata = contact_unlocks.metadata || excluded.metadata
  returning id into v_unlock_id;

  update public.presupuestos
  set
    cliente_id = p_cliente_id,
    comision_pagada = true,
    contacto_habilitado = true,
    commission_amount = p_commission_amount,
    payment_provider = p_payment_provider,
    payment_id = p_payment_id,
    paid_at = now(),
    app_chat_id = coalesce(p_chat_id, app_chat_id),
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
  where id = p_presupuesto_id;

  return v_unlock_id;
end;
$$;

grant execute on function public.create_mica_app_request(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb
) to authenticated;

grant execute on function public.get_provider_contact_access(
  uuid,
  uuid,
  bigint,
  text,
  text,
  text
) to authenticated;

grant execute on function public.mark_presupuesto_contact_unlocked(
  bigint,
  uuid,
  uuid,
  text,
  uuid,
  numeric,
  numeric,
  text,
  text,
  jsonb
) to service_role;

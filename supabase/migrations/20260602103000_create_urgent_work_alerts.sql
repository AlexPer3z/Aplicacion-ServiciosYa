create table if not exists public.urgent_work_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null check (source in ('service_request', 'direct_contact', 'chat_message')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'escalation_ready')),
  worker_id uuid not null,
  cliente_id uuid,
  servicio_id text,
  chat_id uuid,
  notificacion_id uuid,
  category text,
  title text not null default 'Tenes trabajo urgente',
  body text not null,
  attempts_sent integer not null default 0,
  next_attempt_at timestamptz not null default (now() + interval '2 minutes'),
  last_sent_at timestamptz,
  escalation_ready_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists urgent_work_alerts_due_idx
  on public.urgent_work_alerts (status, next_attempt_at)
  where status = 'pending';

create index if not exists urgent_work_alerts_worker_idx
  on public.urgent_work_alerts (worker_id, created_at desc);

create index if not exists urgent_work_alerts_notificacion_idx
  on public.urgent_work_alerts (notificacion_id)
  where notificacion_id is not null;

alter table public.urgent_work_alerts enable row level security;

create policy "urgent_work_alerts_service_role_all"
  on public.urgent_work_alerts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "urgent_work_alerts_authenticated_insert"
  on public.urgent_work_alerts
  for insert
  to authenticated
  with check (cliente_id = auth.uid());

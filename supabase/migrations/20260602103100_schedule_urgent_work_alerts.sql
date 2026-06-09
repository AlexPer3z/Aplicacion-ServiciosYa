create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('process-urgent-work-alerts-every-minute')
where exists (
  select 1
  from cron.job
  where jobname = 'process-urgent-work-alerts-every-minute'
);

select cron.schedule(
  'process-urgent-work-alerts-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://dhhhftzdfpqthzvkrqoz.functions.supabase.co/process-urgent-work-alerts',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

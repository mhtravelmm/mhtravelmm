-- Plan §16B.7: every job logs its result, and a failure notifies Super Admin.
-- The browser runner in `src/lib/jobs.ts` writes the same row shape to storage;
-- this table is what makes the log survive a closed tab and lets pg_cron drive
-- the schedule once the jobs run server-side.

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text not null check (outcome in ('ok', 'failed')),
  detail text not null default ''
);

create index if not exists job_runs_job_started_idx
  on public.job_runs (job, started_at desc);

alter table public.job_runs enable row level security;

-- §16B.1 keeps "Settings and roles" with Super Admin, and this page is the same
-- settings surface, so only Super Admin reads the log.
drop policy if exists job_runs_read on public.job_runs;
create policy job_runs_read on public.job_runs
  for select using (public.current_role_name() = 'Super Admin');

-- No insert, update or delete policy: only the wrapper below writes a row.

/**
 * Runs one job and records the result. The body is passed in so the wrapper
 * owns the logging and the caller owns the work; an exception is caught, logged
 * as `failed`, and re-raised so the scheduler still reports it.
 */
create or replace function public.run_platform_job(p_job text, p_work text)
returns public.job_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.job_runs;
begin
  insert into public.job_runs (job, outcome, detail)
  values (p_job, 'ok', '')
  returning * into v_run;

  begin
    execute p_work;
    update public.job_runs
       set finished_at = now()
     where id = v_run.id
     returning * into v_run;
    return v_run;
  exception when others then
    update public.job_runs
       set finished_at = now(), outcome = 'failed', detail = sqlerrm
     where id = v_run.id
     returning * into v_run;
    raise;
  end;
end;
$$;

revoke all on function public.run_platform_job(text, text) from public;
grant execute on function public.run_platform_job(text, text) to service_role;

/**
 * Plan §16B.7 rental payment expiry, safe to run twice: the function only
 * touches orders still past their deadline. Scheduled through pg_cron when the
 * extension is present, so a project without it still applies the migration.
 */
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'rental-payment-expiry',
      '*/5 * * * *',
      $cron$select public.run_platform_job('rental_payment_expiry', 'select public.expire_overdue_rental_orders()');$cron$
    );
  end if;
end
$$;

-- Plan §8.7: the server is the authority. The client's total is ignored and
-- every rule is re-checked here, so a tampered form cannot create a cheap order
-- or skip a status.

/** Inclusive days: both endpoints count, so a same-day rental is one day. */
create or replace function public.rental_inclusive_days(p_start date, p_end date)
returns integer
language sql
immutable
as $$
  select greatest(1, (p_end - p_start) + 1);
$$;

/**
 * Plan §8.4 step 1: city + category + variant, then city + category, then
 * default + category + variant, then default + category. A row with a null
 * city or variant is a fallback, so it is ranked below an exact match.
 */
create or replace function public.rental_rate_for(
  p_city text,
  p_category text,
  p_variant text
)
returns table (rate_local_usd numeric, rate_foreign_usd numeric)
language sql
stable
security definer
set search_path = public
as $$
  select r.rate_local_usd, r.rate_foreign_usd
  from public.rental_rates r
  where r.category_id = p_category
    and (r.city_id is null or r.city_id = p_city)
    and (r.variant_id is null or r.variant_id = p_variant)
    and r.effective_from <= (now() at time zone 'Asia/Yangon')::date
    and (r.effective_to is null or r.effective_to >= (now() at time zone 'Asia/Yangon')::date)
  order by
    (r.city_id is not null) desc,
    (r.variant_id is not null) desc,
    r.effective_from desc
  limit 1;
$$;

/**
 * Plan §8.7 error codes. The page translates each one through `t()`, so a
 * server rejection reads the same as a client-side check in MM and EN.
 */
create or replace function public.submit_rental_order(
  p_city_id text,
  p_category_id text,
  p_variant_id text,
  p_start_date date,
  p_end_date date,
  p_participants integer,
  p_customer_type text,
  p_fulfillment text,
  p_branch_id text,
  p_delivery_address text,
  p_customer_name text,
  p_phone text,
  p_special_requests text,
  p_terms_version text,
  p_display_currency text,
  p_fx_mmk_per_usd numeric
)
returns public.rental_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Yangon')::date;
  v_category public.rental_categories;
  v_rate_local numeric(10, 2);
  v_rate_foreign numeric(10, 2);
  v_days integer;
  v_rate_usd numeric(10, 2);
  v_total numeric(10, 2);
  v_code text;
  v_sequence integer;
  v_order public.rental_orders;
  v_recent integer;
begin
  if v_uid is null then
    raise exception 'rental_error_not_signed_in' using errcode = 'P0001';
  end if;

  select * into v_category from public.rental_categories
  where id = p_category_id and active = true;
  if not found then
    raise exception 'rental_error_category' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.rental_availability a
    where a.city_id = p_city_id and a.category_id = p_category_id and a.active
  ) then
    raise exception 'rental_error_city_availability' using errcode = 'P0001';
  end if;

  if p_variant_id is not null and not exists (
    select 1 from public.rental_variants v
    where v.id = p_variant_id and v.category_id = p_category_id and v.active
  ) then
    raise exception 'rental_error_variant' using errcode = 'P0001';
  end if;

  if p_fulfillment = 'branch' and not exists (
    select 1 from public.rental_branches b
    where b.id = p_branch_id and b.city_id = p_city_id and b.active
  ) then
    raise exception 'rental_error_branch' using errcode = 'P0001';
  end if;

  if p_start_date < v_today + 1 then
    raise exception 'rental_error_start_date' using errcode = 'P0001';
  end if;
  if p_end_date < p_start_date then
    raise exception 'rental_error_end_date' using errcode = 'P0001';
  end if;
  if v_category.min_days > 1 and p_end_date < p_start_date + (v_category.min_days - 1) then
    raise exception 'rental_error_min_days' using errcode = 'P0001';
  end if;

  if coalesce(length(trim(p_customer_name)), 0) < 2 then
    raise exception 'rental_error_name' using errcode = 'P0001';
  end if;
  if coalesce(length(regexp_replace(p_phone, '[^0-9]', '', 'g')), 0) < 7 then
    raise exception 'rental_error_phone' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'delivery' and coalesce(length(trim(p_delivery_address)), 0) < 3 then
    raise exception 'rental_error_address' using errcode = 'P0001';
  end if;
  if coalesce(p_participants, 0) < 1 then
    raise exception 'rental_error_participants' using errcode = 'P0001';
  end if;

  if p_terms_version is distinct from (
    select version from public.rental_terms order by published_at desc limit 1
  ) then
    raise exception 'rental_error_terms' using errcode = 'P0001';
  end if;

  -- Plan §8.7: rate-limit submissions per account.
  select count(*) into v_recent from public.rental_orders
  where user_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= 10 then
    raise exception 'rental_error_rate_limit' using errcode = 'P0001';
  end if;

  v_days := public.rental_inclusive_days(p_start_date, p_end_date);
  select rate_local_usd, rate_foreign_usd into v_rate_local, v_rate_foreign
  from public.rental_rate_for(p_city_id, p_category_id, p_variant_id);

  if v_rate_local is null then
    raise exception 'rental_error_rate_missing' using errcode = 'P0001';
  end if;

  v_rate_usd := case when p_customer_type = 'foreigner' then v_rate_foreign else v_rate_local end;
  v_total := round(v_rate_usd * v_days, 2);

  -- `RNT-YYMMDD-####`, numbered within the day so a phone read-back is short.
  select count(*) + 1 into v_sequence from public.rental_orders
  where (created_at at time zone 'Asia/Yangon')::date = v_today;
  v_code := format(
    'RNT-%s-%s',
    to_char(v_today, 'YYMMDD'),
    lpad(v_sequence::text, 4, '0')
  );

  insert into public.rental_orders (
    request_code, user_id, customer_name, phone, city_id, category_id, variant_id,
    start_date, end_date, original_start_date, days, participants, customer_type,
    fulfillment, branch_id, delivery_address, special_requests, terms_version,
    rate_usd, total_usd, display_currency, fx_mmk_per_usd, status
  ) values (
    v_code, v_uid, trim(p_customer_name), p_phone, p_city_id, p_category_id, p_variant_id,
    p_start_date, p_end_date, p_start_date, v_days, p_participants, p_customer_type,
    p_fulfillment, p_branch_id,
    case when p_fulfillment = 'delivery' then trim(p_delivery_address) else '' end,
    coalesce(p_special_requests, ''), p_terms_version,
    v_rate_usd, v_total, coalesce(p_display_currency, 'MMK'), coalesce(p_fx_mmk_per_usd, 4500), 'requested'
  ) returning * into v_order;

  insert into public.rental_order_events (order_id, from_status, to_status, actor_id, note)
  values (v_order.id, null, 'requested', v_uid, 'submitted');

  return v_order;
end;
$$;

/** Plan §8.5: staff drive the order, and only along an allowed transition. */
create or replace function public.set_rental_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default '',
  p_payment_method text default null
)
returns public.rental_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.rental_orders;
  v_from text;
  v_allowed boolean;
begin
  if not public.is_rental_staff() then
    raise exception 'rental_error_forbidden' using errcode = 'P0001';
  end if;

  select * into v_order from public.rental_orders where id = p_order_id for update;
  if not found then
    raise exception 'rental_error_order_missing' using errcode = 'P0001';
  end if;

  v_from := v_order.status;
  v_allowed := case v_order.status
    when 'requested' then p_status in ('accepted', 'cancelled')
    when 'accepted' then p_status in ('paid', 'expired', 'cancelled')
    when 'paid' then p_status in ('completed', 'cancelled')
    else false
  end;
  if not v_allowed then
    raise exception 'rental_error_status_transition' using errcode = 'P0001';
  end if;

  if p_status = 'paid' and p_payment_method is null then
    raise exception 'rental_error_payment_method' using errcode = 'P0001';
  end if;

  update public.rental_orders set
    status = p_status,
    accepted_at = case when p_status = 'accepted' then now() else accepted_at end,
    payment_deadline = case when p_status = 'accepted' then now() + interval '12 hours' else payment_deadline end,
    payment_method = case when p_status = 'paid' then p_payment_method else payment_method end,
    payment_received_at = case when p_status = 'paid' then now() else payment_received_at end,
    received_by = case when p_status = 'paid' then v_uid else received_by end,
    handled_by = v_uid,
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.rental_order_events (order_id, from_status, to_status, actor_id, note)
  values (p_order_id, v_from, p_status, v_uid, coalesce(p_note, ''));

  return v_order;
end;
$$;

/**
 * Plan §8.5 reschedule: once, at least 24 hours before the original start, to a
 * start of at least tomorrow, keeping the same number of days. A new voucher
 * version is issued because the dates on the printed page changed.
 */
create or replace function public.reschedule_rental_order(
  p_order_id uuid,
  p_start_date date
)
returns public.rental_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.rental_orders;
  v_from text;
  v_today date := (now() at time zone 'Asia/Yangon')::date;
begin
  select * into v_order from public.rental_orders where id = p_order_id for update;
  if not found then
    raise exception 'rental_error_order_missing' using errcode = 'P0001';
  end if;
  if v_order.user_id <> v_uid then
    raise exception 'rental_error_forbidden' using errcode = 'P0001';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'rental_error_reschedule_not_paid' using errcode = 'P0001';
  end if;
  if v_order.rescheduled_count >= 1 then
    raise exception 'rental_error_reschedule_limit' using errcode = 'P0001';
  end if;
  if v_order.original_start_date - interval '24 hours' < now() then
    raise exception 'rental_error_reschedule_too_late' using errcode = 'P0001';
  end if;
  if p_start_date < v_today + 1 then
    raise exception 'rental_error_start_date' using errcode = 'P0001';
  end if;
  if p_start_date = v_order.start_date then
    raise exception 'rental_error_reschedule_unchanged' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.rental_availability a
    where a.city_id = v_order.city_id and a.category_id = v_order.category_id and a.active
  ) then
    raise exception 'rental_error_city_availability' using errcode = 'P0001';
  end if;

  v_from := v_order.start_date::text;
  update public.rental_orders set
    start_date = p_start_date,
    end_date = p_start_date + (v_order.days - 1),
    rescheduled_count = rescheduled_count + 1,
    voucher_version = voucher_version + 1,
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.rental_order_events (order_id, from_status, to_status, actor_id, note)
  values (p_order_id, v_order.status, v_order.status, v_uid, format('rescheduled:%s->%s', v_from, p_start_date));

  return v_order;
end;
$$;

/**
 * Plan §8.9: the 5-minute job. Safe to run twice because a second pass finds no
 * Accepted order past its deadline.
 */
create or replace function public.expire_overdue_rental_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with overdue as (
    update public.rental_orders
    set status = 'expired', updated_at = now()
    where status = 'accepted' and payment_deadline < now()
    returning id
  )
  insert into public.rental_order_events (order_id, from_status, to_status, note)
  select id, 'accepted', 'expired', 'payment_window_passed' from overdue;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.submit_rental_order(text, text, text, date, date, integer, text, text, text, text, text, text, text, text, text, numeric) from public;
revoke all on function public.set_rental_order_status(uuid, text, text, text) from public;
revoke all on function public.reschedule_rental_order(uuid, date) from public;
revoke all on function public.expire_overdue_rental_orders() from public;

grant execute on function public.submit_rental_order(text, text, text, date, date, integer, text, text, text, text, text, text, text, text, text, numeric) to authenticated;
grant execute on function public.reschedule_rental_order(uuid, date) to authenticated;
grant execute on function public.set_rental_order_status(uuid, text, text, text) to authenticated;
grant execute on function public.expire_overdue_rental_orders() to service_role;

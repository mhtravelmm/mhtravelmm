-- Plan §3 and §8.3: `public.profiles.role` stores a role slug (`rental_admin`)
-- while the UI and the permission matrix speak the product name
-- (`Rental Admin`). `20261122000050_rental_roles.sql` compared the product
-- names directly, so no staff account ever matched and every rental write was
-- rejected as forbidden. Normalise here, once, so the rest of the schema keeps
-- comparing product names.

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select
      case regexp_replace(lower(trim(p.role)), '[\s-]+', '_', 'g')
        when 'super_admin' then 'Super Admin'
        when 'ads_admin' then 'Ads Admin'
        when 'admin' then 'Admin'
        when 'rental_admin' then 'Rental Admin'
        when 'payment_admin' then 'Payment Admin'
        when 'travel_guide_admin' then 'Travel Guide Content Admin'
        when 'travel_guide_content_admin' then 'Travel Guide Content Admin'
        when 'blog_admin' then 'Blog Post Admin'
        when 'blog_post_admin' then 'Blog Post Admin'
        when 'owner_admin' then 'Owner Admin'
        else ''
      end
     from public.profiles p where p.id = auth.uid()),
    ''
  );
$$;

/**
 * Plan §16B.1: the Payment Admin row is `R + record payment`, so it may read
 * orders and record a payment but not accept, cancel or complete one. Reads
 * stay on `is_rental_staff()` above, which already includes Payment Admin;
 * writes ask this predicate instead, so a payment-only account is never
 * treated as a full rental admin.
 */
create or replace function public.can_handle_rental_orders()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Rental Admin', 'Admin', 'Super Admin');
$$;

-- Plan §8.5: only an order handler may move an order between statuses. The
-- accepted -> paid step is the one Payment Admin also needs, so it is allowed
-- for that role alone and nowhere else.
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
  -- Checked before the row is read, so a caller without the right cannot tell
  -- an existing order id from a missing one.
  if not (
    public.can_handle_rental_orders()
    or (public.current_role_name() = 'Payment Admin' and p_status = 'paid')
  ) then
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

-- Plan §8.8: catalog and terms edits are Rental Admin, Admin and Super Admin.
-- A Payment Admin may record a payment, not reprice a category.
create or replace function public.is_rental_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_handle_rental_orders();
$$;

-- The extra lines a guide's lodging, food and travel costs become (§16) are
-- staff cost entries, so they follow order handling rather than payment rights.
drop policy if exists rental_order_extras_write on public.rental_order_extras;
create policy rental_order_extras_write on public.rental_order_extras
  for all using (public.can_handle_rental_orders())
  with check (public.can_handle_rental_orders());

revoke all on function public.set_rental_order_status(uuid, text, text, text) from public;
grant execute on function public.set_rental_order_status(uuid, text, text, text) to authenticated;

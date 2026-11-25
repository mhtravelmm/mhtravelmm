-- Plan §8.3 access: roles come from `public.profiles` and are checked on the
-- server. Client role helpers only hide menus, so every policy and every
-- function below asks this one predicate instead of trusting the browser.

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    ''
  );
$$;

/**
 * Rental Admin, Admin and Super Admin handle rental orders and edit the catalog.
 * Payment Admin may read totals and record payments, so it is included where the
 * caller only needs payment rights (checked separately in `record_rental_payment`).
 */
create or replace function public.is_rental_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in (
    'Rental Admin', 'Admin', 'Super Admin', 'Payment Admin'
  );
$$;

/** Catalog and terms edits are narrower than order handling (Plan §8.8). */
create or replace function public.is_rental_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Rental Admin', 'Admin', 'Super Admin');
$$;

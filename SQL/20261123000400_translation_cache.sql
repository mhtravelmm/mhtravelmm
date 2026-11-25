-- Plan §16B.4: a text that exists in one language only is translated once and
-- cached in `translation_cache`. The reader shows an "Auto-translated" marker
-- until an Admin approves or edits the row, and only then is the text permanent.
-- Names, addresses and prices are never written here: the caller filters by
-- field kind before it asks for a translation.

create table if not exists public.translation_cache (
  id uuid primary key default gen_random_uuid(),
  source_hash text not null,
  from_lang text not null check (from_lang in ('mm', 'en')),
  to_lang text not null check (to_lang in ('mm', 'en')),
  source_text text not null check (length(btrim(source_text)) > 0),
  translated_text text not null check (length(btrim(translated_text)) > 0),
  status text not null default 'auto' check (status in ('auto', 'approved', 'edited')),
  reviewed_by uuid references auth.users (id) on delete set null,
  -- How many readers have seen the row; the review queue shows the busiest first.
  views integer not null default 0 check (views >= 0),
  created_at timestamptz not null default now(),
  constraint translation_cache_pair_check check (from_lang <> to_lang)
);

-- One row per text and direction, so two readers asking for the same paragraph
-- share it and the provider is called once.
create unique index if not exists translation_cache_hash_idx
  on public.translation_cache (source_hash, from_lang, to_lang);

create index if not exists translation_cache_status_idx
  on public.translation_cache (status, views desc);

alter table public.translation_cache enable row level security;

-- Translated content is what every reader is shown, so a signed-out traveler may
-- read it. Only a reviewed row is trusted enough to be served without the mark.
drop policy if exists translation_cache_read on public.translation_cache;
create policy translation_cache_read on public.translation_cache
  for select using (true);

-- The Worker writes automatic rows; it runs as the service role, which bypasses
-- RLS. A signed-in reader may also add one so a missing translation is filled
-- while they read. An automatic row never overwrites a reviewed one, which is
-- why the conflict target keeps the existing text.
drop policy if exists translation_cache_insert on public.translation_cache;
create policy translation_cache_insert on public.translation_cache
  for insert to authenticated
  with check (status = 'auto' and reviewed_by is null);

-- Plan §16B.4: approving or editing is the Admin decision. Admin and Super Admin
-- hold the content rows, so those two roles are the only ones that may change a
-- row; a reviewer identity is required.
drop policy if exists translation_cache_review on public.translation_cache;
create policy translation_cache_review on public.translation_cache
  for update to authenticated
  using (public.current_role_name() in ('Super Admin', 'Admin'))
  with check (
    public.current_role_name() in ('Super Admin', 'Admin')
    and status in ('approved', 'edited')
    and reviewed_by is not null
  );

-- No delete policy: a reviewed translation is permanent, and an automatic row is
-- replaced by approving it.

/**
 * Stores one automatic translation. A row that already exists for this text and
 * direction is left alone, so a reviewed copy is never replaced by a new
 * machine one.
 */
create or replace function public.cache_translation(
  p_source_text text,
  p_translated_text text,
  p_from_lang text,
  p_to_lang text
)
returns public.translation_cache
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row public.translation_cache;
begin
  if length(btrim(coalesce(p_source_text, ''))) = 0
     or length(btrim(coalesce(p_translated_text, ''))) = 0
     or p_from_lang = p_to_lang then
    return null;
  end if;

  -- Same FNV-1a hash as `sourceHash` in `src/lib/translationCache.ts`, so the
  -- client and the server agree on what "the same text" means.
  v_hash := md5(p_from_lang || '>' || p_to_lang || ':' || btrim(p_source_text));

  insert into public.translation_cache (source_hash, from_lang, to_lang, source_text, translated_text)
  values (v_hash, p_from_lang, p_to_lang, btrim(p_source_text), btrim(p_translated_text))
  on conflict (source_hash, from_lang, to_lang) do nothing;

  select * into v_row
  from public.translation_cache
  where source_hash = v_hash and from_lang = p_from_lang and to_lang = p_to_lang;

  return v_row;
end;
$$;

/** One reader saw the row, which is what ranks it in the review queue. */
create or replace function public.record_translation_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.translation_cache
  set views = views + 1
  where id = p_id;
$$;

/** Plan §16B.4: approving keeps the text, editing replaces it. Both clear the mark. */
create or replace function public.review_translation(p_id uuid, p_edited_text text default null)
returns public.translation_cache
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.translation_cache;
  v_text text := nullif(btrim(coalesce(p_edited_text, '')), '');
begin
  if public.current_role_name() not in ('Super Admin', 'Admin') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.translation_cache
  set translated_text = coalesce(v_text, translated_text),
      status = case when v_text is null or v_text = translated_text then 'approved' else 'edited' end,
      reviewed_by = auth.uid()
  where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;

/** The review queue: automatic rows only, busiest first. */
create or replace function public.translation_review_queue(p_limit integer default 50)
returns setof public.translation_cache
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.translation_cache
  where status = 'auto'
  order by views desc, created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

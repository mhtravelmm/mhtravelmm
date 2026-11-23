-- Plan §10 §3 `save_blog_post(post, expected_version)` and §7 acceptance 5:
-- two editors saving one post must not silently overwrite each other.
--
-- The client store (`src/lib/contentStore.ts`) bumps `version` on every save
-- and refuses a save that carries an older one (`src/lib/contentLifecycle.ts`).
-- This is the same rule on the server, so the browser cannot be the only place
-- that enforces it. A write must claim exactly the next version; anything else
-- means someone else saved first and the caller is told `version_conflict`.

create or replace function public.enforce_content_version()
returns trigger
language plpgsql
as $$
begin
  if new.version is distinct from old.version + 1 then
    raise exception 'version_conflict'
      using errcode = '40001',
            detail = format('row is at version %s, this save claimed %s', old.version, new.version);
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_version_guard on public.blog_posts;
create trigger blog_posts_version_guard
  before update on public.blog_posts
  for each row execute function public.enforce_content_version();

drop trigger if exists travel_guides_version_guard on public.travel_guides;
create trigger travel_guides_version_guard
  before update on public.travel_guides
  for each row execute function public.enforce_content_version();

/**
 * Unpublish and soft delete (Plan §10 §4). Both are ordinary updates that must
 * still claim the next version, so they cannot land on top of another editor's
 * save either. `published_at` is cleared on unpublish because the row is no
 * longer live; `deleted_at` is what takes a row off the public view.
 */
create or replace function public.unpublish_blog_post(p_id text, p_expected_version integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version integer;
begin
  update public.blog_posts
     set status = 'Draft',
         published_at = null,
         scheduled_for = null,
         version = p_expected_version + 1
   where id = p_id
     and version = p_expected_version
  returning version into v_version;

  if v_version is null then
    raise exception 'version_conflict' using errcode = '40001';
  end if;
  return v_version;
end;
$$;

create or replace function public.soft_delete_content(p_kind text, p_id text, p_expected_version integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version integer;
begin
  if p_kind = 'blog' then
    update public.blog_posts
       set deleted_at = now(), version = p_expected_version + 1
     where id = p_id and version = p_expected_version
    returning version into v_version;
  elsif p_kind = 'guide' then
    update public.travel_guides
       set deleted_at = now(), version = p_expected_version + 1
     where id = p_id and version = p_expected_version
    returning version into v_version;
  else
    raise exception 'unknown content kind %', p_kind using errcode = '22023';
  end if;

  if v_version is null then
    raise exception 'version_conflict' using errcode = '40001';
  end if;
  return v_version;
end;
$$;

-- Restoring a soft-deleted row is the same rule in reverse.
create or replace function public.restore_content(p_kind text, p_id text, p_expected_version integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version integer;
begin
  if p_kind = 'blog' then
    update public.blog_posts
       set deleted_at = null, version = p_expected_version + 1
     where id = p_id and version = p_expected_version
    returning version into v_version;
  elsif p_kind = 'guide' then
    update public.travel_guides
       set deleted_at = null, version = p_expected_version + 1
     where id = p_id and version = p_expected_version
    returning version into v_version;
  else
    raise exception 'unknown content kind %', p_kind using errcode = '22023';
  end if;

  if v_version is null then
    raise exception 'version_conflict' using errcode = '40001';
  end if;
  return v_version;
end;
$$;

/**
 * `publish_due_content` predates the version guard, so it must now claim the
 * next version too — otherwise the trigger would refuse the job's own write.
 * Everything else about the function is unchanged.
 */
create or replace function public.publish_due_content(p_now timestamptz default now())
returns table (blog integer, guide integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blog integer;
  v_guide integer;
begin
  with due as (
    update public.blog_posts
       set status = 'Published',
           published_at = (p_now at time zone 'Asia/Yangon')::date,
           scheduled_for = null,
           version = version + 1,
           updated_at = now()
     where status = 'Scheduled'
       and scheduled_for <= p_now
       and deleted_at is null
    returning 1
  )
  select count(*) into v_blog from due;

  with due as (
    update public.travel_guides
       set status = 'Published',
           published_at = (p_now at time zone 'Asia/Yangon')::date,
           scheduled_for = null,
           version = version + 1,
           updated_at = now()
     where status = 'Scheduled'
       and scheduled_for <= p_now
       and deleted_at is null
    returning 1
  )
  select count(*) into v_guide from due;

  return query select v_blog, v_guide;
end;
$$;

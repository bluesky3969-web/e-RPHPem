-- e-RPH Pemulihan Khas - skema Supabase
-- Jalankan fail ini sekali dalam Supabase > SQL Editor.
-- Skema ini tidak membaca atau memadam data localStorage dalam aplikasi.

create table if not exists public.erph_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.erph_state_versions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  version bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create index if not exists erph_state_versions_user_created_idx
  on public.erph_state_versions (user_id, created_at desc);

alter table public.erph_state enable row level security;
alter table public.erph_state_versions enable row level security;

drop policy if exists "Pengguna baca state sendiri" on public.erph_state;
create policy "Pengguna baca state sendiri"
  on public.erph_state for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Pengguna tambah state sendiri" on public.erph_state;
create policy "Pengguna tambah state sendiri"
  on public.erph_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Pengguna kemas kini state sendiri" on public.erph_state;
create policy "Pengguna kemas kini state sendiri"
  on public.erph_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Pengguna baca versi sendiri" on public.erph_state_versions;
create policy "Pengguna baca versi sendiri"
  on public.erph_state_versions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Pengguna tambah versi sendiri" on public.erph_state_versions;
create policy "Pengguna tambah versi sendiri"
  on public.erph_state_versions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Pengguna padam versi lama sendiri" on public.erph_state_versions;
create policy "Pengguna padam versi lama sendiri"
  on public.erph_state_versions for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.save_erph_state(
  p_expected_version bigint,
  p_data jsonb
)
returns table(new_version bigint, saved_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.erph_state%rowtype;
  v_saved public.erph_state%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_current
  from public.erph_state
  where user_id = v_user_id
  for update;

  if not found then
    if coalesce(p_expected_version, 0) <> 0 then
      raise exception 'VERSION_CONFLICT:0';
    end if;

    insert into public.erph_state (user_id, data, version, updated_at)
    values (v_user_id, p_data, 1, now())
    returning * into v_saved;
  else
    if v_current.version <> coalesce(p_expected_version, -1) then
      raise exception 'VERSION_CONFLICT:%', v_current.version;
    end if;

    if v_current.data = p_data then
      return query select v_current.version, v_current.updated_at;
      return;
    end if;

    update public.erph_state
    set data = p_data,
        version = v_current.version + 1,
        updated_at = now()
    where user_id = v_user_id
    returning * into v_saved;
  end if;

  insert into public.erph_state_versions (user_id, version, data, created_at)
  values (v_user_id, v_saved.version, v_saved.data, v_saved.updated_at)
  on conflict (user_id, version) do nothing;

  delete from public.erph_state_versions old_version
  where old_version.user_id = v_user_id
    and old_version.id not in (
      select keep_version.id
      from public.erph_state_versions keep_version
      where keep_version.user_id = v_user_id
      order by keep_version.version desc
      limit 100
    );

  return query select v_saved.version, v_saved.updated_at;
end;
$$;

revoke all on public.erph_state from anon;
revoke all on public.erph_state_versions from anon;
grant select, insert, update on public.erph_state to authenticated;
grant select, insert, delete on public.erph_state_versions to authenticated;
grant usage, select on sequence public.erph_state_versions_id_seq to authenticated;
grant execute on function public.save_erph_state(bigint, jsonb) to authenticated;


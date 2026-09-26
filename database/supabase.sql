create table if not exists public.league_state (
  id text primary key default 'padel-thursday',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists league_state_touch_updated_at on public.league_state;
create trigger league_state_touch_updated_at
before update on public.league_state
for each row
execute function public.touch_updated_at();

insert into public.league_state (id, data)
values (
  'padel-thursday',
  jsonb_build_object(
    'players', jsonb_build_array(
      jsonb_build_object('id', 'philip', 'name', 'Philip'),
      jsonb_build_object('id', 'tom', 'name', 'Tom'),
      jsonb_build_object('id', 'ben', 'name', 'Ben'),
      jsonb_build_object('id', 'geert', 'name', 'Geert'),
      jsonb_build_object('id', 'wesley', 'name', 'Wesley'),
      jsonb_build_object('id', 'carl', 'name', 'Carl'),
      jsonb_build_object('id', 'stefan', 'name', 'Stefan'),
      jsonb_build_object('id', 'michel', 'name', 'Michel')
    ),
    'rounds', jsonb_build_array(),
    'roundType', 'auto'
  )
)
on conflict (id) do nothing;

alter table public.league_state enable row level security;

drop policy if exists "Public league read" on public.league_state;
create policy "Public league read"
on public.league_state
for select
using (true);

-- For a quick private prototype, you can temporarily enable this update policy.
-- For the real version, replace it with Supabase Auth so only the admin can write.
drop policy if exists "Prototype league update" on public.league_state;
create policy "Prototype league update"
on public.league_state
for update
using (true)
with check (true);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  spreadsheet_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, spreadsheet_id)
);

alter table public.forms enable row level security;
create policy "Users manage their own forms"
  on public.forms for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update, delete on public.forms to authenticated;

-- These tables are only read/written by the Edge Function's service role.
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token_ciphertext text not null,
  updated_at timestamptz not null default now()
);
alter table public.google_connections enable row level security;

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
alter table public.oauth_states enable row level security;


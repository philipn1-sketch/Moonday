-- Moonday's backup and partner sharing. Each family's data is encrypted on the phone before it is sent,
-- with a key made from the family code that never leaves the phones; this table only ever holds
-- ciphertext under an id that is itself a hash. Nobody with database access can read a cycle.
create table if not exists public.moonday_vaults (
  id text primary key check (id ~ '^[0-9a-f]{64}$'),
  box text not null check (octet_length(box) <= 4000000),
  nonce text not null check (octet_length(nonce) <= 64),
  shared_at bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.moonday_vaults enable row level security;
-- no policies: the table is reached only through the functions below

create or replace function public.moonday_get(vault text) returns jsonb
language sql security definer set search_path = '' stable as $$
  select jsonb_build_object('box', v.box, 'nonce', v.nonce, 'sharedAt', v.shared_at)
  from public.moonday_vaults v where v.id = vault;
$$;

-- keeps whichever copy was shared last, so an older phone can never overwrite a newer backup
create or replace function public.moonday_put(vault text, box text, nonce text, shared_at bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.moonday_vaults as v (id, box, nonce, shared_at)
  values (vault, box, nonce, shared_at)
  on conflict (id) do update set box = excluded.box, nonce = excluded.nonce, shared_at = excluded.shared_at, updated_at = now()
  where excluded.shared_at >= v.shared_at;
  return found;
end;
$$;

create or replace function public.moonday_delete(vault text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.moonday_vaults v where v.id = vault;
  return found;
end;
$$;

revoke all on function public.moonday_get(text) from public;
revoke all on function public.moonday_put(text, text, text, bigint) from public;
revoke all on function public.moonday_delete(text) from public;
grant execute on function public.moonday_get(text) to anon;
grant execute on function public.moonday_put(text, text, text, bigint) to anon;
grant execute on function public.moonday_delete(text) to anon;

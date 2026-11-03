-- Pega todo esto en Supabase → SQL Editor → Run.
-- ANTES: sustituye tu@email.com (aparece 2 veces) por tu email de propietario.

create table public.site(id int primary key default 1 check(id=1), data jsonb not null default '{}');
insert into public.site(data) values('{}');
create table public.items(
  id uuid primary key default gen_random_uuid(), sec text default 'General', kind text not null default 'note',
  title text not null, body text, url text, file_path text, file_name text, file_type text,
  vis text not null default 'private' check (vis in ('private','restricted','public')),
  listed boolean not null default false, pos bigint default (extract(epoch from now())*1000)::bigint);
create table public.grants(item_id uuid references public.items on delete cascade, user_id uuid references auth.users on delete cascade, primary key(item_id,user_id));
create table public.invites(email text primary key);
create table public.profiles(id uuid primary key, email text);

create function public.is_owner() returns boolean language sql stable as
$$ select lower(coalesce(auth.jwt()->>'email','')) = lower('juanguticerd@gmail.com') $$;

-- Solo se puede crear cuenta con invitación (o siendo el propietario)
create function public.on_signup() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if lower(new.email)<>lower('juanguticerd@gmail.com') and not exists(select 1 from public.invites where lower(email)=lower(new.email)) then
    raise exception 'Registro solo por invitación';
  end if;
  insert into public.profiles values(new.id,new.email);
  return new;
end $$;
create trigger t_signup before insert on auth.users for each row execute function public.on_signup();

alter table public.site enable row level security;
alter table public.items enable row level security;
alter table public.grants enable row level security;
alter table public.invites enable row level security;
alter table public.profiles enable row level security;

create policy s_r on public.site for select using(true);
create policy s_w on public.site for all using(public.is_owner()) with check(public.is_owner());
create policy i_r on public.items for select using(public.is_owner() or vis='public'
  or (vis='restricted' and exists(select 1 from public.grants g where g.item_id=items.id and g.user_id=auth.uid())));
create policy i_w on public.items for all using(public.is_owner()) with check(public.is_owner());
create policy g_r on public.grants for select using(public.is_owner() or user_id=auth.uid());
create policy g_w on public.grants for all using(public.is_owner()) with check(public.is_owner());
create policy v_o on public.invites for all using(public.is_owner()) with check(public.is_owner());
create policy p_r on public.profiles for select using(public.is_owner() or id=auth.uid());

-- Archivos (bucket privado; el acceso se decide por la visibilidad del contenido)
insert into storage.buckets(id,name,public) values('files','files',false);
create policy f_r on storage.objects for select using(bucket_id='files' and (public.is_owner() or exists(
  select 1 from public.items i where i.file_path=name and (i.vis='public'
    or (i.vis='restricted' and exists(select 1 from public.grants g where g.item_id=i.id and g.user_id=auth.uid()))))));
create policy f_w on storage.objects for all using(bucket_id='files' and public.is_owner()) with check(bucket_id='files' and public.is_owner());

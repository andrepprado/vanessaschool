create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text not null,
    role text not null default 'student'
        check (role in ('admin','student')),
    level text not null default 'A1'
        check (level in ('A1','A2','B1','B2','C1')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.student_progress (
    student_id uuid primary key
        references public.profiles(id)
        on delete cascade,
    progress_percent integer not null default 0
        check (progress_percent between 0 and 100),
    xp integer not null default 0
        check (xp >= 0),
    streak integer not null default 0
        check (streak >= 0),
    teacher_notes text not null default '',
    updated_at timestamptz not null default now()
);

create table if not exists public.student_assignments (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null
        references public.profiles(id)
        on delete cascade,
    title text not null,
    description text not null default '',
    assignment_type text not null default 'activity'
        check (assignment_type in ('material','activity','exercise')),
    level text not null default 'A1'
        check (level in ('A1','A2','B1','B2','C1')),
    content_url text,
    status text not null default 'active'
        check (status in ('active','completed','archived')),
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role
on public.profiles(role);

create index if not exists idx_profiles_level
on public.profiles(level);

create index if not exists idx_student_assignments_student
on public.student_assignments(student_id);

create index if not exists idx_student_assignments_status
on public.student_assignments(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at
on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists student_progress_set_updated_at
on public.student_progress;

create trigger student_progress_set_updated_at
before update on public.student_progress
for each row
execute function public.set_updated_at();

drop trigger if exists student_assignments_set_updated_at
on public.student_assignments;

create trigger student_assignments_set_updated_at
before update on public.student_assignments
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (
        id,
        email,
        name,
        role,
        level,
        active
    )
    values (
        new.id,
        coalesce(new.email,''),
        coalesce(
            nullif(new.raw_user_meta_data ->> 'name',''),
            split_part(coalesce(new.email,'Aluno'),'@',1)
        ),
        'student',
        'A1',
        true
    )
    on conflict (id) do nothing;

    insert into public.student_progress (
        student_id
    )
    values (
        new.id
    )
    on conflict (student_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

insert into public.profiles (
    id,
    email,
    name,
    role,
    level,
    active
)
select
    u.id,
    coalesce(u.email,''),
    coalesce(
        nullif(u.raw_user_meta_data ->> 'name',''),
        split_part(coalesce(u.email,'Aluno'),'@',1)
    ),
    'student',
    'A1',
    true
from auth.users u
on conflict (id) do nothing;

insert into public.student_progress (
    student_id
)
select id
from public.profiles
on conflict (student_id) do nothing;

alter table public.profiles
enable row level security;

alter table public.student_progress
enable row level security;

alter table public.student_assignments
enable row level security;

revoke all
on table public.profiles
from anon, authenticated;

revoke all
on table public.student_progress
from anon, authenticated;

revoke all
on table public.student_assignments
from anon, authenticated;

grant select
on table public.profiles
to authenticated;

grant select
on table public.student_progress
to authenticated;

grant select
on table public.student_assignments
to authenticated;

drop policy if exists student_read_own_profile
on public.profiles;

create policy student_read_own_profile
on public.profiles
for select
to authenticated
using (
    (select auth.uid()) = id
);

drop policy if exists student_read_own_progress
on public.student_progress;

create policy student_read_own_progress
on public.student_progress
for select
to authenticated
using (
    (select auth.uid()) = student_id
);

drop policy if exists student_read_own_assignments
on public.student_assignments;

create policy student_read_own_assignments
on public.student_assignments
for select
to authenticated
using (
    (select auth.uid()) = student_id
    and status in ('active','completed')
);
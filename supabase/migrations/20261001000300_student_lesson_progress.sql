alter table public.student_progress
add column if not exists completed_lessons text[] not null default '{}';

alter table public.student_progress
add column if not exists lesson_progress jsonb not null default '{}'::jsonb;

alter table public.student_progress
add column if not exists correct_answers integer not null default 0;

alter table public.student_progress
add column if not exists total_answers integer not null default 0;

alter table public.student_progress
add column if not exists last_study_date date;

alter table public.student_progress
add column if not exists xp_today integer not null default 0;

grant select, update
on table public.student_progress
to authenticated;

drop policy if exists student_update_own_progress
on public.student_progress;

create policy student_update_own_progress
on public.student_progress
for update
to authenticated
using (
    (select auth.uid()) = student_id
)
with check (
    (select auth.uid()) = student_id
);

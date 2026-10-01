create table if not exists public.student_exercise_progress (
    student_id uuid not null
        references public.profiles(id)
        on delete cascade,
    exercise_id text not null,
    lesson_id text not null,
    level text not null
        check (
            level in (
                'A1',
                'A2',
                'B1',
                'B2',
                'C1'
            )
        ),
    correct boolean not null default false,
    attempts integer not null default 0
        check (attempts >= 0),
    last_answer text not null default '',
    completed_at timestamptz,
    updated_at timestamptz not null default now(),
    primary key (
        student_id,
        exercise_id
    )
);

create index if not exists idx_exercise_progress_student
on public.student_exercise_progress(student_id);

create index if not exists idx_exercise_progress_level
on public.student_exercise_progress(level);

alter table public.student_exercise_progress
enable row level security;

revoke all
on table public.student_exercise_progress
from anon;

revoke all
on table public.student_exercise_progress
from authenticated;

grant select, insert, update
on table public.student_exercise_progress
to authenticated;

drop policy if exists student_read_own_exercise_progress
on public.student_exercise_progress;

create policy student_read_own_exercise_progress
on public.student_exercise_progress
for select
to authenticated
using (
    (select auth.uid()) = student_id
);

drop policy if exists student_insert_own_exercise_progress
on public.student_exercise_progress;

create policy student_insert_own_exercise_progress
on public.student_exercise_progress
for insert
to authenticated
with check (
    (select auth.uid()) = student_id
);

drop policy if exists student_update_own_exercise_progress
on public.student_exercise_progress;

create policy student_update_own_exercise_progress
on public.student_exercise_progress
for update
to authenticated
using (
    (select auth.uid()) = student_id
)
with check (
    (select auth.uid()) = student_id
);
-- 018_add_multi_platform_task_types.sql
--
-- Widens tasks.task_type to cover Quora, Facebook, and Twitter/X
-- task types alongside the existing Reddit ones. Also constrains
-- tasks.platform (previously unconstrained free text) to the set
-- of platforms the app actually knows how to render.
--
-- Reddit values (unchanged):   post, comment, hyperlink_post,
--                               hyperlink_comment, reply, crosspost
-- Quora values (new):          answer, comment
-- Facebook values (new):       post, comment, share
-- Twitter/X values (new):      tweet, reply, retweet
--
-- See lib/platforms.ts for the single source of truth these
-- values must stay in sync with.

alter table public.tasks
  drop constraint if exists tasks_task_type_check;

alter table public.tasks
  add constraint tasks_task_type_check
  check (
    task_type = any (array[
      'post',
      'comment',
      'hyperlink_comment',
      'hyperlink_post',
      'reply',
      'crosspost',
      'answer',
      'share',
      'tweet',
      'retweet'
    ])
  );

alter table public.tasks
  drop constraint if exists tasks_platform_check;

alter table public.tasks
  add constraint tasks_platform_check
  check (
    platform is null
    or platform = any (array['reddit', 'quora', 'facebook', 'twitter'])
  );

-- Backfill any legacy rows saved before "platform" was always set.
update public.tasks set platform = 'reddit' where platform is null;

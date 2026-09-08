-- Mission Next Technical Academy — one-time cleanup for the signOut()
-- event-listener bug.
--
-- portal/app.js's wireCommon() used to wire the "Sign Out" button as
-- `signout.addEventListener('click', signOut)`. addEventListener calls its
-- handler with the click Event as the first argument, which landed in
-- signOut(reason = 'user_signed_out')'s `reason` parameter instead of the
-- default string (a default parameter only applies to an `undefined`
-- argument, and a real Event is always passed). That Event object then hit
-- `ended_reason: reason` in the site_sessions UPDATE, which
-- site_sessions_ended_reason_check and the site_sessions_self_close RLS
-- policy's with_check both reject (neither accepts anything but the fixed
-- 'user_signed_out'/'idle_timeout'/'admin_forced'/'superseded' set). The
-- update failed silently (caught, console.error'd only), so every manual
-- "Sign Out" click left that student's site_sessions row open. Combined
-- with the concurrency cap (20260906120500_site_session_concurrency_cap.sql,
-- raised to 2 for students by 20260906140000_student_session_cap_two.sql),
-- two sign-out/sign-in cycles were enough to strand both of a student's
-- open-session slots and lock them out with MNT_SESSION_LIMIT_REACHED on a
-- perfectly ordinary next sign-in.
--
-- The listener itself is fixed in the same change as this migration
-- (portal/app.js now wires `() => signOut()`), so this is a one-time data
-- fix, not a recurring cleanup. ended_reason is always null on an open row
-- regardless of cause (it is only ever set alongside ended_at), so there is
-- no column-level way to tell "stranded by this bug" apart from "genuinely
-- still active this instant" -- closing every open row is a deliberate
-- one-time reset, not a targeted repair. Anyone actually mid-session gets
-- signed out and simply signs back in, now under the fixed handler.
update public.site_sessions
set ended_at = now(),
    ended_reason = 'user_signed_out'
where ended_at is null;

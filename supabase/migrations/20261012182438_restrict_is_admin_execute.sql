-- Only signed-in users may call is_admin(); anonymous visitors may not.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Endurecer las funciones SECURITY DEFINER y los permisos. RECONSTRUIDA desde
-- el esquema vivo, por el mismo motivo que la anterior.
--
-- Dos cosas:
--
-- 1. `handle_new_user` no la puede ejecutar nadie desde la API. Solo la llama
--    el disparador, y un `execute` publico sobre una funcion SECURITY DEFINER
--    que inserta perfiles seria una puerta abierta.
-- 2. El permiso de UPDATE de `authenticated` sobre `profiles` va POR COLUMNA, y
--    `role` no esta en la lista. Es lo que impide que alguien se ascienda a
--    administrador con un update sobre su propia fila: la politica RLS solo
--    dice «tu fila», el permiso por columna dice «y de tu fila, solo esto».

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_platform_admin(uuid) from public, anon;
grant execute on function public.is_platform_admin(uuid) to authenticated;

revoke insert, update, delete, references on public.profiles from authenticated;
grant update (first_name, last_name, location, specialty, years_of_experience)
  on public.profiles to authenticated;

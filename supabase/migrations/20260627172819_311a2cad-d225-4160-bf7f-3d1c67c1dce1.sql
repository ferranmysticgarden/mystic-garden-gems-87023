
-- Revoke client EXECUTE on trigger-only SECURITY DEFINER functions.
-- Triggers still fire (they run as table owner), but PostgREST RPC is closed.
REVOKE EXECUTE ON FUNCTION public.guard_season_passes_client_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_game_progress_client_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_piggy_bank_client_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_game_progress() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

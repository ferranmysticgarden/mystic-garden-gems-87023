-- achievements: allow owner UPDATE + DELETE
CREATE POLICY "Users can update their own achievements"
  ON public.achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.achievements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- game_progress: allow owner DELETE
CREATE POLICY "Users can delete their own game progress"
  ON public.game_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- piggy_bank: allow owner DELETE (user_id column; guest rows have NULL user_id and remain undeletable from client)
CREATE POLICY "Users can delete their own piggy bank"
  ON public.piggy_bank
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- season_passes: allow owner DELETE
CREATE POLICY "Users can delete their own season pass"
  ON public.season_passes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
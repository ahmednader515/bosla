-- Run before deploying teacher assistants (supports enum and text role columns).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TEACHER_ASSISTANT';
  END IF;
END $$;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_id TEXT REFERENCES "User"(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS user_teacher_id_idx ON "User"(teacher_id);
DO $$ DECLARE constraint_row RECORD; BEGIN
  FOR constraint_row IN SELECT conname FROM pg_constraint WHERE conrelid = '"User"'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%' LOOP
    EXECUTE format('ALTER TABLE "User" DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;
ALTER TABLE "User" ADD CONSTRAINT user_role_check CHECK (role::text IN ('ADMIN', 'ASSISTANT_ADMIN', 'STUDENT', 'TEACHER', 'TEACHER_ASSISTANT'));

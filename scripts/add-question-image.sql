-- صورة للسؤال في الاختبار + صورة سؤال الواجب في الحصة
-- تشغيله مرة واحدة من لوحة Neon: SQL Editor

ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS question_image_url TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS homework_image_url TEXT;

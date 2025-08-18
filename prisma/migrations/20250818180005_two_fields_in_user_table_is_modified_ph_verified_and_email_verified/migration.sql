-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "email_verified_at" DROP NOT NULL,
ALTER COLUMN "phone_verifier_at" DROP NOT NULL;

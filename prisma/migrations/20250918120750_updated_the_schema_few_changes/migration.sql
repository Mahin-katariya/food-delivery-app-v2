/*
  Warnings:

  - You are about to drop the column `phone_verifier_at` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "phone_verifier_at",
ADD COLUMN     "phone_verified_at" TIMESTAMP(3);

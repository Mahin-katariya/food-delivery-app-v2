/*
  Warnings:

  - The values [COMPLETED,ABANDONED] on the enum `OnboardingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `branch_id` on the `BranchMenuItems` table. All the data in the column will be lost.
  - You are about to drop the column `source_brand_item_id` on the `BranchMenuItems` table. All the data in the column will be lost.
  - You are about to drop the column `brand_id` on the `OnboardingSession` table. All the data in the column will be lost.
  - You are about to drop the column `menu_image_url` on the `RestaurantBrands` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RestaurantBrands` table. All the data in the column will be lost.
  - You are about to drop the `BrandCuisines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrandItemVariants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrandMenuCategories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrandMenuItems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrandMenuTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MenuUpdateProposals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Cuisines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branch_id]` on the table `OnboardingSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refresh_token]` on the table `RefreshTokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_id` to the `BranchMenuItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `UserOTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OnboardingStatus_new" AS ENUM ('STARTED', 'PHASE_1_COMPLETE', 'PHASE_2_COMPLETE', 'PHASE_3_COMPLETE', 'COMPLETE', 'DABANDONED');
ALTER TABLE "public"."OnboardingSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."OnboardingSession" ALTER COLUMN "status" TYPE "public"."OnboardingStatus_new" USING ("status"::text::"public"."OnboardingStatus_new");
ALTER TYPE "public"."OnboardingStatus" RENAME TO "OnboardingStatus_old";
ALTER TYPE "public"."OnboardingStatus_new" RENAME TO "OnboardingStatus";
DROP TYPE "public"."OnboardingStatus_old";
ALTER TABLE "public"."OnboardingSession" ALTER COLUMN "status" SET DEFAULT 'STARTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."BranchMenuItems" DROP CONSTRAINT "BranchMenuItems_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BranchMenuItems" DROP CONSTRAINT "BranchMenuItems_source_brand_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandCuisines" DROP CONSTRAINT "BrandCuisines_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandCuisines" DROP CONSTRAINT "BrandCuisines_cuisines_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandItemVariants" DROP CONSTRAINT "BrandItemVariants_brand_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandMenuCategories" DROP CONSTRAINT "BrandMenuCategories_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandMenuItems" DROP CONSTRAINT "BrandMenuItems_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandMenuTemplate" DROP CONSTRAINT "BrandMenuTemplate_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MenuUpdateProposals" DROP CONSTRAINT "MenuUpdateProposals_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MenuUpdateProposals" DROP CONSTRAINT "MenuUpdateProposals_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OnboardingSession" DROP CONSTRAINT "OnboardingSession_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserOTP" DROP CONSTRAINT "UserOTP_user_id_fkey";

-- DropIndex
DROP INDEX "public"."OnboardingSession_brand_id_key";

-- AlterTable
ALTER TABLE "public"."Address" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."BranchMenuItems" DROP COLUMN "branch_id",
DROP COLUMN "source_brand_item_id",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."OnboardingSession" DROP COLUMN "brand_id",
ADD COLUMN     "branch_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."RestaurantBranches" ALTER COLUMN "branch_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."RestaurantBrands" DROP COLUMN "menu_image_url",
DROP COLUMN "status",
ALTER COLUMN "logo_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserOTP" ADD COLUMN     "phone_number" TEXT NOT NULL,
ALTER COLUMN "user_id" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."BrandCuisines";

-- DropTable
DROP TABLE "public"."BrandItemVariants";

-- DropTable
DROP TABLE "public"."BrandMenuCategories";

-- DropTable
DROP TABLE "public"."BrandMenuItems";

-- DropTable
DROP TABLE "public"."BrandMenuTemplate";

-- DropTable
DROP TABLE "public"."City";

-- DropTable
DROP TABLE "public"."Country";

-- DropTable
DROP TABLE "public"."MenuUpdateProposals";

-- DropTable
DROP TABLE "public"."State";

-- DropEnum
DROP TYPE "public"."proposal_status";

-- DropEnum
DROP TYPE "public"."status";

-- CreateTable
CREATE TABLE "public"."BranchCuisines" (
    "branch_id" INTEGER NOT NULL,
    "cuisine_id" INTEGER NOT NULL,

    CONSTRAINT "BranchCuisines_pkey" PRIMARY KEY ("branch_id","cuisine_id")
);

-- CreateTable
CREATE TABLE "public"."BranchMenuCategories" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BranchMenuCategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuisines_name_key" ON "public"."Cuisines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_branch_id_key" ON "public"."OnboardingSession"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_refresh_token_key" ON "public"."RefreshTokens"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "public"."User"("phone_number");

-- AddForeignKey
ALTER TABLE "public"."UserOTP" ADD CONSTRAINT "UserOTP_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingSession" ADD CONSTRAINT "OnboardingSession_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchCuisines" ADD CONSTRAINT "BranchCuisines_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchCuisines" ADD CONSTRAINT "BranchCuisines_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "public"."Cuisines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuCategories" ADD CONSTRAINT "BranchMenuCategories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuItems" ADD CONSTRAINT "BranchMenuItems_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."BranchMenuCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

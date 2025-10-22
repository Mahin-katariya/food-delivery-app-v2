-- CreateEnum
CREATE TYPE "public"."RestaurantStatus" AS ENUM ('draft', 'active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "public"."devices" AS ENUM ('App', 'WebDashboard');

-- CreateEnum
CREATE TYPE "public"."OnboardingStatus" AS ENUM ('STARTED', 'PHASE_1_COMPLETE', 'PHASE_2_COMPLETE', 'PHASE_3_COMPLETE', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "public"."RestaurantBranches" ADD COLUMN     "menu_image_url" TEXT,
ADD COLUMN     "order_devices" "public"."devices" NOT NULL DEFAULT 'WebDashboard',
ADD COLUMN     "status" "public"."RestaurantStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "public"."RestaurantBrands" ADD COLUMN     "menu_image_url" TEXT,
ADD COLUMN     "status" "public"."RestaurantStatus" NOT NULL DEFAULT 'draft';

-- CreateTable
CREATE TABLE "public"."OnboardingSession" (
    "id" SERIAL NOT NULL,
    "status" "public"."OnboardingStatus" NOT NULL DEFAULT 'STARTED',
    "manager_id" INTEGER NOT NULL,
    "brand_id" INTEGER,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandCuisines" (
    "brand_id" INTEGER NOT NULL,
    "cuisines_id" INTEGER NOT NULL,

    CONSTRAINT "BrandCuisines_pkey" PRIMARY KEY ("brand_id","cuisines_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_brand_id_key" ON "public"."OnboardingSession"("brand_id");

-- AddForeignKey
ALTER TABLE "public"."OnboardingSession" ADD CONSTRAINT "OnboardingSession_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingSession" ADD CONSTRAINT "OnboardingSession_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."RestaurantBrands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandCuisines" ADD CONSTRAINT "BrandCuisines_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."RestaurantBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandCuisines" ADD CONSTRAINT "BrandCuisines_cuisines_id_fkey" FOREIGN KEY ("cuisines_id") REFERENCES "public"."Cuisines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

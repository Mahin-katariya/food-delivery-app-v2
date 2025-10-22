-- CreateEnum
CREATE TYPE "public"."type" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "public"."week_day" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- CreateEnum
CREATE TYPE "public"."status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "public"."proposal_status" AS ENUM ('pending', 'accepting', 'rejected');

-- CreateTable
CREATE TABLE "public"."RestaurantBrands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "RestaurantBrands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantBranches" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address_id" INTEGER NOT NULL,
    "branch_name" TEXT NOT NULL,
    "is_accepting_orders" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RestaurantBranches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantMedia" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" "public"."type" NOT NULL DEFAULT 'image',

    CONSTRAINT "RestaurantMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantTimings" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "weekDay" "public"."week_day" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTimings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cuisines" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandMenuTemplate" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "public"."status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "BrandMenuTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandMenuCategories" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BrandMenuCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandMenuItems" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "BrandMenuItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandItemVariants" (
    "id" SERIAL NOT NULL,
    "brand_item_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price_modifier" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "BrandItemVariants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchMenuItems" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "source_brand_item_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BranchMenuItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchItemVariants" (
    "id" SERIAL NOT NULL,
    "branch_item_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "BranchItemVariants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuUpdateProposals" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "status" "public"."proposal_status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "MenuUpdateProposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantBrands_name_key" ON "public"."RestaurantBrands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantBranches_address_id_key" ON "public"."RestaurantBranches"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "BrandMenuTemplate_brand_id_version_key" ON "public"."BrandMenuTemplate"("brand_id", "version");

-- AddForeignKey
ALTER TABLE "public"."RestaurantBranches" ADD CONSTRAINT "RestaurantBranches_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."RestaurantBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantBranches" ADD CONSTRAINT "RestaurantBranches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantBranches" ADD CONSTRAINT "RestaurantBranches_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantMedia" ADD CONSTRAINT "RestaurantMedia_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantTimings" ADD CONSTRAINT "RestaurantTimings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandMenuTemplate" ADD CONSTRAINT "BrandMenuTemplate_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."RestaurantBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandMenuCategories" ADD CONSTRAINT "BrandMenuCategories_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."BrandMenuTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandMenuItems" ADD CONSTRAINT "BrandMenuItems_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."BrandMenuCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandItemVariants" ADD CONSTRAINT "BrandItemVariants_brand_item_id_fkey" FOREIGN KEY ("brand_item_id") REFERENCES "public"."BrandMenuItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuItems" ADD CONSTRAINT "BranchMenuItems_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuItems" ADD CONSTRAINT "BranchMenuItems_source_brand_item_id_fkey" FOREIGN KEY ("source_brand_item_id") REFERENCES "public"."BrandMenuItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchItemVariants" ADD CONSTRAINT "BranchItemVariants_branch_item_id_fkey" FOREIGN KEY ("branch_item_id") REFERENCES "public"."BranchMenuItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuUpdateProposals" ADD CONSTRAINT "MenuUpdateProposals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."BrandMenuTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuUpdateProposals" ADD CONSTRAINT "MenuUpdateProposals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

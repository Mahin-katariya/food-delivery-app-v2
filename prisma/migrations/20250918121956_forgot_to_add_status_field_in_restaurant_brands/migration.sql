-- AlterTable
ALTER TABLE "public"."RestaurantBrands" ADD COLUMN     "status" "public"."RestaurantStatus" NOT NULL DEFAULT 'draft';

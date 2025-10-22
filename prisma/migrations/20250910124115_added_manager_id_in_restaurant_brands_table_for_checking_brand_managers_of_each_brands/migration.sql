/*
  Warnings:

  - Added the required column `manager_id` to the `RestaurantBrands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."RestaurantBrands" ADD COLUMN     "manager_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."RestaurantBrands" ADD CONSTRAINT "RestaurantBrands_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."otp_status" AS ENUM ('pending', 'verified', 'expired');

-- CreateTable
CREATE TABLE "public"."UserRoles" (
    "id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3) NOT NULL,
    "phone_verifier_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshTokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "device_info" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserHasRoles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "UserHasRoles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "public"."UserOTP" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "otp_code" INTEGER NOT NULL,
    "status" "public"."otp_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."State" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."City" (
    "id" SERIAL NOT NULL,
    "state_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" SERIAL NOT NULL,
    "street_address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAddresses" (
    "user_id" INTEGER NOT NULL,
    "address_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "UserAddresses_pkey" PRIMARY KEY ("user_id","address_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "public"."Country"("name");

-- AddForeignKey
ALTER TABLE "public"."RefreshTokens" ADD CONSTRAINT "RefreshTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshTokens" ADD CONSTRAINT "RefreshTokens_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."UserRoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHasRoles" ADD CONSTRAINT "UserHasRoles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHasRoles" ADD CONSTRAINT "UserHasRoles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."UserRoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOTP" ADD CONSTRAINT "UserOTP_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAddresses" ADD CONSTRAINT "UserAddresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAddresses" ADD CONSTRAINT "UserAddresses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

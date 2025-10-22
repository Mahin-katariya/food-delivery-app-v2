-- CreateTable
CREATE TABLE "public"."UserBankAccount" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBankAccount_user_id_key" ON "public"."UserBankAccount"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserBankAccount_branch_id_key" ON "public"."UserBankAccount"("branch_id");

-- AddForeignKey
ALTER TABLE "public"."UserBankAccount" ADD CONSTRAINT "UserBankAccount_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."RestaurantBranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBankAccount" ADD CONSTRAINT "UserBankAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

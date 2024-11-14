/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `pay_balance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transaction_id]` on the table `pay_expense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pay_balance_transaction_id_key" ON "pay_balance"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "pay_expense_transaction_id_key" ON "pay_expense"("transaction_id");

import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { PaymeError } from '../constants/payme-error';
import { TransactionState } from '../constants/transaction-state';
import { CancelingReasons } from '../payme.service';
import { CheckPerformTransactionDto } from '../dto/check-perform-transaction.dto';
import { TransactionMethods } from '../constants/transaction-methods';
import { ErrorStatusCodes } from '../constants/error-status-codes';
import { copyFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import * as console from "node:console";


export async function createTransaction(
  this: any,
  createTransactionDto: CreateTransactionDto,
) {
  const userId = Number(createTransactionDto.params?.account?.package_id);
  const amount = createTransactionDto.params.amount;
  if (!userId) {
    return {
      error: {
        code: ErrorStatusCodes.InvalidAuthorization,
        message: {
          uz: 'Noto‘g‘ri avtorizatsiya',
          en: 'Invalid authorization',
          ru: 'Неверная авторизация',
        },
      },
    };
  }

  const pcg = await this.prismaService.pay_package.findUnique({
    where: { id: userId, price: amount},
  });
  if (!pcg) {
    return {
      error: {
        code: ErrorStatusCodes.TransactionNotAllowed,
        message: {
          uz: 'Noto‘g‘ri avtorizatsiya',
          en: 'Invalid authorization',
          ru: 'Неверная авторизация',
        },
      },
    };
  }

  if (pcg.price < amount) {
    return {
      error: {
        code: ErrorStatusCodes.InvalidAmount,
        message: {
          ru: 'Неверная сумма',
          uz: 'Incorrect amount',
          en: 'Incorrect amount',
        },
      },
    };
  }

  if (amount < 1 || amount > 999999999){
    return {
      error: {
        code: ErrorStatusCodes.InvalidAmount,
        message: {
          ru: 'Неверная сумма',
          uz: 'Incorrect amount',
          en: 'Incorrect amount',
        },
      },
    };
  }
  const transId = await this.prismaService.pay_expense.findUnique({
    where: { transaction_id: createTransactionDto.params.id },
  });

  if (transId) {
    return {
      result: {
        balance: transId.price,
        transaction: transId.transaction_id,
        state: TransactionState.Pending,
        create_time: new Date(transId.created_at).getTime(),
      },
    };
  }

  const checkTransaction: CheckPerformTransactionDto = {
    method: TransactionMethods.CheckPerformTransaction,
    params: {
      amount: amount,
      account: {
        package_id: userId,
      },
    },
  };

  const checkResult = await this.checkPerformTransaction(checkTransaction);

  if (checkResult.error) {
    return {
      error: checkResult.error,
      id: transId?.transaction_id, 
    };
  }

  const newTransaction = await this.prismaService.pay_expense.create({
    data: {
      package_id: userId,
      price: amount,
      transaction_id: createTransactionDto.params.id,
      state: 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    result: {
      balance: newTransaction.price,
      transaction: newTransaction.transaction_id,
      state: TransactionState.Pending,
      create_time: new Date(newTransaction.created_at).getTime(),
    },
  };
}

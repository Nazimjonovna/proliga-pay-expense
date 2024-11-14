import { PerformTransactionDto } from '../dto/perform-transaction.dto';
import { PaymeError } from '../constants/payme-error';
import { TransactionState } from '../constants/transaction-state';
import { CancelingReasons } from '../constants/canceling-reasons';
import { ErrorStatusCodes } from '../constants/error-status-codes';

export async function performTransaction(
  this: any,
  performTransactionDto: PerformTransactionDto,
) {
  const transaction = await this.prismaService.pay_expense.findFirst({
    where: { transaction_id: performTransactionDto.params.id },
  });

  if (!transaction) {
    return {
      error: {
        code: ErrorStatusCodes.InvalidAuthorization,
        message: {
          uz: 'Transacsiya topilmadi',
          en: 'Transaction not found ',
          ru: 'Неверная transaction',
        },
      },
    };
  }

  if (transaction.state !== TransactionState.Pending) {
    if (transaction.state !== TransactionState.Paid) {
      return {
        error: PaymeError.CantDoOperation,
        id: performTransactionDto.params.id,
      };
    }

    return {
      result: {
        state: transaction.state,
        transaction: transaction.id,
        perform_time: transaction.updated_at
          ? new Date(transaction.updated_at).getTime()
          : null,
      },
    };
  }

  const isExpired = this.checkTransactionExpiration(transaction.created_at);

  if (isExpired) {
    await this.prismaService.pay_expense.update({
      where: { id: transaction.id },
      data: {
        status: 'CANCELED',
        canceled_at: new Date(),
        state: TransactionState.PendingCanceled,
        reason: Number(CancelingReasons.CanceledDueToTimeout),
      },
    });

    return {
      error: {
        state: TransactionState.PendingCanceled,
        reason: CancelingReasons.CanceledDueToTimeout,
        ...PaymeError.CantDoOperation,
      },
      id: performTransactionDto.params.id,
    };
  }

  const performTime = new Date();

  const updatedTransaction = await this.prismaService.pay_expense.update({
    where: { id: transaction.id },
    data: {
      status: 'PAID',
      state: TransactionState.Paid,
      updated_at: performTime,
    },
  });

  return {
    result: {
      transaction: updatedTransaction.id,
      perform_time: performTime.getTime(),
      state: TransactionState.Paid,
    },
  };
}

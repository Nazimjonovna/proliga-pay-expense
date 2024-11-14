import { CancelTransactionDto } from '../dto/cancel-transaction.dto';
import { TransactionState } from '../constants/transaction-state';
import { ErrorStatusCodes } from '../constants/error-status-codes';

export async function cancelTransaction(
  this: any,
  cancelTransactionDto: CancelTransactionDto,
) {
  const transId = cancelTransactionDto.params.id;

  const transaction = await this.prismaService.pay_expense.findUnique({
    where: { transaction_id: transId },
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

  if (transaction.state === TransactionState.Pending) {
    const canceledTransaction = await this.prismaService.pay_expense.update({
      where: { id: transaction.id },
      data: {
        status: TransactionState.PaidCanceled,
        state: TransactionState.PendingCanceled,
        canceled_at: new Date(),
        reason: cancelTransactionDto.params.reason,
      },
    });

    return {
      result: {
        cancel_time: canceledTransaction.canceled_at?.getTime(),
        transaction: canceledTransaction.id,
        state: TransactionState.PendingCanceled,
      },
    };
  }

  return {
    result: {
      state: transaction.state,
      transaction: transaction.id,
      cancel_time: transaction.canceled_at?.getTime(),
    },
  };
}

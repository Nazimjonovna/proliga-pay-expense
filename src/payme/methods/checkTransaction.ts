import { ErrorStatusCodes } from '../constants/error-status-codes';
import { CheckTransactionDto } from '../dto/check-transaction.dto';
import * as console from "node:console";

export async function checkTransaction(
  this: any,
  checkTransactionDto: CheckTransactionDto,
) {
  const transactionId = checkTransactionDto.params.id;

    const transaction = await this.prismaService.pay_expense.findUnique({
      where: { transaction_id: transactionId },
    });

    if (!transaction){
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

    if (!transaction.transaction_id) {
      return {
        error: {
          code: 1008,
          message: {
            uz: "Tranzaksiya topilmadi",
            en: "Transaction not found",
            ru: "Транзакция не найдена",
          },
        },
      };
    }

    if (transaction.status === 'paid') {
      
      return {
        error: {
          code: 1009,  
          message: {
            uz: "Tranzaksiya to'lov qilingan",
            en: "Transaction has already been paid",
            ru: "Транзакция уже оплачена",
          },
        },
      };
    }

    return {
      result: {
        create_time: new Date(transaction.created_at).getTime(), 
        perform_time: transaction.perform_time ? new Date(transaction.perform_time).getTime() : 0,
        cancel_time: transaction.canceled_at ? new Date(transaction.canceled_at).getTime() : 0,
        transaction : transaction.transaction_id,
        state: transaction.state !== null && transaction.state !== undefined ? transaction.state : 2,
        reason: transaction.reason
      },
    };
}

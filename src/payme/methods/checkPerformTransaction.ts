import { CheckPerformTransactionDto } from '../dto/check-perform-transaction.dto';
import { ErrorStatusCodes } from '../constants/error-status-codes';
import * as console from "node:console";

export async function checkPerformTransaction(
  this: any,
  checkPerformTransactionDto: CheckPerformTransactionDto,
) {
  const userId = checkPerformTransactionDto.params?.account?.package_id
    ? Number(checkPerformTransactionDto.params?.account?.package_id)
    : null;
  const price = checkPerformTransactionDto.params.amount;

  if (!userId) {
    return {
      error: {
        code: ErrorStatusCodes.InvalidAuthorization,
        message: {
          uz: 'Foydalanuvchi identifikatori kiritilmagan',
          en: 'User ID is missing',
          ru: 'Идентификатор пользователя отсутствует',
        },
      },
    };
  }

  const pkg = await this.prismaService.pay_package.findUnique({
    where: { id: userId},
  });

  if (!pkg) {
    return {
      error: {
        code: ErrorStatusCodes.TransactionNotAllowed,
        message: {
          uz: "Transaction topilmadi",
          en: 'User balance does not exist',
          ru: 'Баланс пользователя не существует',
        },
      },
    };
  }

  const pckg = await this.prismaService.pay_package.findUnique({
    where: { id: userId, price: price },
  });
  if (!pckg) {
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

  if (price < 1 || price > 999999999 ) {
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

  return { result: { allow: true } };
}

import { PAYMENTSYSTEM } from 'src/enum/system.enum';
import { ClickRequestDto } from '../dto/click-request.dto';
import { GenerateMd5HashParams } from '../interfaces/generate-prepare-hash.interface';
import { ClickError } from 'src/enum/Payment.enum';
import { TransactionStatus } from '../constants/status-codes';

export async function prepare(this: any, clickReqBody: ClickRequestDto) {
  const serviceId = Number(process.env.CLICK_SERVICE_ID);

  const merchantTransId = clickReqBody.merchant_trans_id;
  const userId = Number(clickReqBody.user_id);
  const amount = clickReqBody.amount;
  const transId = clickReqBody.click_trans_id;
  const signString = clickReqBody.sign_string;
  const action = 0;
  const signTime = clickReqBody.sign_time;

  const myMD5Params: GenerateMd5HashParams = {
    clickTransId: transId,
    secretKey: this.secretKey,
    merchantTransId,
    serviceId: this.serviceId,
    amount,
    action,
    signTime,
  };

  const myMD5Hash = this.hashingService.generateMD5(myMD5Params);
  console.log(myMD5Hash)
  console.log(typeof userId)

  if (signString !== myMD5Hash) {
    return {
      error: ClickError.SignFailed,
      error_note: 'Invalid sign_string',
    };
  }
  const isValidUserId = this.checkObjectId(userId);

  if (!isValidUserId) {
    return {
      error: ClickError.BadRequest,
      error_note: 'Invalid user_id, user_id must be number',
    };
  }

  const isAlreadyPaid = await this.prismaService.pay_balance.findFirst({
    where: {
      transaction_id: transId.toString(),
      status: 'PAID',
    },
  });

  if (isAlreadyPaid) {
    return {
      error: ClickError.AlreadyPaid,
      error_note: 'Already paid',
    };
  }

  const isCancelled = await this.prismaService.pay_balance.findFirst({
    where: {
      user_id: Number(userId),
      status: 'CANCELED',
    },
  });

  if (isCancelled) {
    return {
      error: ClickError.TransactionCanceled,
      error_note: 'Cancelled',
    };
  }

  const user = await this.prismaService.users.findFirst({
    where: {
      id: Number(userId),
    },
  });

  if (!user) {
    return {
      error: ClickError.UserNotFound,
      error_note: 'Invalid userId',
    };
  }

  const transaction = await this.prismaService.pay_balance.findUnique({
    where: {
      id: Number(transId),
    },
  });

  if (transaction && transaction.status === TransactionStatus.Canceled) {
    return {
      error: ClickError.TransactionCanceled,
      error_note: 'Transaction canceled',
    };
  }

  const existingTransaction = await this.prismaService.pay_balance.findUnique({
    where: { transaction_id: transId.toString() },
  });
  
  if (existingTransaction) {
    return 'Transaction ID already exists.';
  }
  
  const time = new Date();
  
  await this.prismaService.pay_balance.create({
    data: {
      user_id: Number(userId),
      transaction_id: transId.toString(),
      status: TransactionStatus.Pending,
      system: PAYMENTSYSTEM.CLICK,
      price: amount,
      created_at: time,
      updated_at: time,
    },
  });
  

  return {
    click_trans_id: Number(transId),
    merchant_trans_id: merchantTransId,
    merchant_prepare_id: time,
    error: ClickError.Success,
    error_note: 'Success',
  };
}

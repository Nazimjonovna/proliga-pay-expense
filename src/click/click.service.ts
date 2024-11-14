import { Injectable } from '@nestjs/common';
import { ClickRequestDto } from './dto/click-request.dto';
import { TransactionActions } from './constants/transaction-action';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { ConfigService } from '@nestjs/config';
import { ClickError } from 'src/enum/Payment.enum';
import { prepare } from './services/prepare';
import { complete } from './services/complete';

@Injectable()
export class ClickService {
  private readonly secretKey: string;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('CLICK_SECRET');
  }

  async handleMerchantTransactions(clickReqBody: ClickRequestDto) {
    const actionType = Number(clickReqBody.action);

    clickReqBody.amount = parseFloat(clickReqBody.amount.toString());

    switch (actionType) {
      case TransactionActions.Prepare:
        return this.prepare(clickReqBody);
      case TransactionActions.Complete:
        return this.complete(clickReqBody);
      default:
        return {
          error: ClickError.ActionNotFound,
          error_note: 'Invalid action',
        };
    }
  }

  prepare(clickReqBody: ClickRequestDto) {
    return prepare.call(this, clickReqBody);
  }

  complete(clickReqBody: ClickRequestDto) {
    return complete.call(this, clickReqBody);
  }

  private checkObjectId(id: number) {
    return typeof id === 'number';
  }
}

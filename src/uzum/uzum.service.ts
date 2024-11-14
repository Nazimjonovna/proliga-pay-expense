import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { ErrorStatusCode } from './constants/error-status-codes';
import { ErrorHttpStatusCode } from '@nestjs/common/utils/http-error-by-code.util';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { ResponseStatus } from './constants/response-status';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { CheckTransactionStatusDto } from './dto/check-status.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { PAYMENTSYSTEM } from 'src/enum/system.enum';


@Injectable()
export class UzumService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async check(checkTransactionDto: CheckTransactionDto) {
    const serviceId = checkTransactionDto.serviceId;

    if (!this.checkServiceId(serviceId)) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.ErrorCheckingPaymentData);
    }

    return {
      serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Ok,
      data: {
        account: {
          value: checkTransactionDto.params.accountId, // Assuming this is passed instead
        },
      },
    };
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const name = createTransactionDto.transId
    const serviceId = createTransactionDto.serviceId;
    const transId = createTransactionDto.transId;
    const price = new Decimal(createTransactionDto.price);

    if (!this.checkServiceId(serviceId)) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.ErrorCheckingPaymentData);
    }

    const existingTransaction = await this.prismaService.pay_balance.findUnique({
      where: { id: Number(transId) },
    });

    if (existingTransaction) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.ErrorCheckingPaymentData, 'Transaction already exists');
    }

    const transaction = await this.prismaService.pay_balance.create({
      data: {
        transaction_id: transId,
        user_id: Number(createTransactionDto.params.userId),
        price:  Number(price),
        // system: PAYMENTSYSTEM.UZUM,
        status: 'PENDING',
        created_at: new Date(),
        name: name
      },
    });

    return {
      serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Created,
      transTime: new Date().valueOf(),
      transId: transaction.transaction_id,
      price: createTransactionDto.price,
    };
  }

  async confirm(confirmTransactionDto: ConfirmTransactionDto) {
    const serviceId = confirmTransactionDto.serviceId;
    const transId = confirmTransactionDto.transId;

    if (!this.checkServiceId(serviceId)) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.InvalidServiceId);
    }

    const transaction = await this.prismaService.pay_balance.findUnique({
      where: { id: Number(transId) },
    });

    if (!transaction) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.AdditionalPaymentPropertyNotFound);
    }

    if (transaction.status !== 'PENDING') {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.PaymentAlreadyProcessed);
    }

    await this.prismaService.pay_balance.update({
      where: { id: Number(transId) },
      data: {
        updated_at: new Date(),
        status: 'PAID',
      },
    });

    return {
      serviceId,
      transId,
      status: ResponseStatus.Confirmed,
      confirmTime: new Date().valueOf(),
    };
  }

  async reverse(reverseTransactionDto: ReverseTransactionDto) {
    const serviceId = reverseTransactionDto.serviceId;
    const transId = reverseTransactionDto.transId;

    if (!this.checkServiceId(serviceId)) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.InvalidServiceId);
    }

    const transaction = await this.prismaService.pay_balance.findUnique({
      where: { id: Number(transId) },
    });

    if (!transaction) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.AdditionalPaymentPropertyNotFound);
    }

    await this.prismaService.pay_balance.update({
      where: { id: Number(transId) },
      data: {
        created_at: new Date(),
        status: 'CANCELED',
      },
    });

    return {
      serviceId,
      transId,
      status: ResponseStatus.Reversed,
      reverseTime: new Date().valueOf(),
      price: transaction.price,
    };
  }

  async status(checkTransactionDto: CheckTransactionStatusDto) {
    const serviceId = checkTransactionDto.serviceId;
    const transId = checkTransactionDto.transId;

    if (!this.checkServiceId(serviceId)) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.InvalidServiceId);
    }

    const transaction = await this.prismaService.pay_balance.findUnique({
      where: { id: Number(transId) },
    });

    if (!transaction) {
      throw this.createBadRequestError(serviceId, ErrorStatusCode.AdditionalPaymentPropertyNotFound);
    }

    return {
      serviceId,
      transId,
      status: transaction.status,
    };
  }

  private createBadRequestError(serviceId: number, errorCode: ErrorHttpStatusCode, message?: string) {
    return new BadRequestException({
      serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Failed,
      errorCode,
      message,
    });
  }

  private checkServiceId(serviceId: number) {
    const myServiceId = this.configService.get<number>('UZUM_SERVICE_ID');
    return serviceId === myServiceId;
  }
}

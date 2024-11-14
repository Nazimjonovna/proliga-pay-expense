export class CreateTransactionDto {
    serviceId: number;
    timestamp: number;
    transId: string;
    params: {
      userId: string;
      [key: string]: any;
    };
    price: number;
  }
  
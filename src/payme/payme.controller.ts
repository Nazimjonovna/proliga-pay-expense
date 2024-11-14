import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { PaymeService } from './payme.service';
  import { RequestBody } from './types/incoming-request-body';
  
  @Controller('payme')
  export class PaymeController {
    constructor(private readonly paymeService: PaymeService) {}
  
    @Post("pay")
    @HttpCode(HttpStatus.OK)
    async handleTransactionMethods(@Body() reqBody: RequestBody) {
      return await this.paymeService.handleTransactionMethods(reqBody);
    }
  }
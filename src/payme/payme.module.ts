import { Module } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { PaymeController } from './payme.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [PaymeController],
  providers: [PaymeService],
  imports: [PrismaModule],
})
export class PaymeModule {}

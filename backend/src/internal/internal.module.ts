import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsModule } from '../chats/chats.module';
import { User } from '../user/entities/user.entity';
import { InternalController } from './internal.controller';
import { InternalGuard } from './internal.guard';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ChatsModule],
  controllers: [InternalController],
  providers: [SupportService, InternalGuard],
  exports: [SupportService],
})
export class InternalModule {}

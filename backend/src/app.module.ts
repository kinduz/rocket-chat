import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthModule } from './auth/auth.module';
import { OtpCode } from './auth/entities/otp-code.entity';
import { ChatsModule } from './chats/chats.module';
import { Chat, ChatMember, Message } from './chats/entities';
import { InternalModule } from './internal/internal.module';
import { ProfileModule } from './profile/profile.module';
import { S3Module } from './shared/s3';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, OtpCode, Chat, ChatMember, Message],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    S3Module,
    UserModule,
    AuthModule,
    ProfileModule,
    ChatsModule,
    InternalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

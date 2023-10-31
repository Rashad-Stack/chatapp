import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  providers: [UserService, UserResolver, JwtService],
})
export class UserModule {}

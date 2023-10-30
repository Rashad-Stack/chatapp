import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, AuthResolver, JwtService],
})
export class AuthModule {}

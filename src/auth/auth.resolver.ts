import { BadRequestException } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { RegisterResponse } from './auth.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerDto') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ) {
    // Checking password and confirm password are same
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new Error('Password and confirm password are not same');
    }

    const user = await this.authService.register(registerDto, context.res);

    return { user };
  }

  @Mutation(() => String)
  async login(
    @Args('loginDto') loginDto: LoginDto,
    @Context() context: { res: Response },
  ) {
    const user = await this.authService.login(loginDto, context.res);
    return { user };
  }

  @Mutation(() => String)
  async logout(@Context() context: { res: Response }) {
    return await this.authService.logout(context.res);
  }

  @Mutation(() => String)
  async refreshToken(@Context() context: { req: Request; res: Response }) {
    try {
      return this.authService.refreshToken(context.req, context.res);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => String)
  async hello() {
    return 'Hello world';
  }
}

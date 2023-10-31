import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { DatabaseService } from 'src/database/database.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async refreshToken(req: Request, res: Response) {
    // check id Token is there
    const refresh_token = req.cookies['refresh_token'];
    if (!refresh_token) {
      throw new UnauthorizedException('refresh token not found');
    }

    // check refresh token is valid
    let payload;
    try {
      payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException("refresh token isn't valid");
    }

    // check user exist in database
    const userExist = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!userExist) {
      throw new UnauthorizedException('user not found');
    }

    // create expiration date in days
    const expiresIn = 60 * 60 * 24 * 7;
    const expirationDate = Math.floor(Date.now() / 1000) + expiresIn;

    // create access token and refresh token with jwt
    const access_token = this.jwtService.sign(
      {
        ...payload,
        expirationDate,
      },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      },
    );

    // set cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      maxAge: expiresIn * 1000,
    });

    return access_token;
  }

  private async issueToken(user: User, res: Response) {
    const payload = {
      username: user.fullname,
      sub: user.id,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: '150sec',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', access_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.databaseService.user.findUnique({
      where: {
        email,
      },
    });

    // check user is valid
    if (user && bcrypt.compare(password, user.password)) {
      return user;
    } else {
      throw new BadRequestException('Invalid email or password');
    }
  }

  async register(registerDto: RegisterDto, res: Response): Promise<User> {
    const user = await this.databaseService.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    // check user is not exist
    if (user) {
      throw new BadRequestException('User already exist');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // create new user
    const newUser = await this.databaseService.user.create({
      data: {
        fullname: registerDto.fullname,
        email: registerDto.email,
        password: hashedPassword,
      },
    });

    // issue token
    return this.issueToken(newUser, res);
  }

  async login(loginDto: LoginDto, res: Response): Promise<User> {
    //  check user exist in database
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new BadRequestException({
        invalidCredential: 'Invalid Credential',
      });
    }

    // issue token
    return this.issueToken(user, res);
  }

  async logout(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return true;
  }
}

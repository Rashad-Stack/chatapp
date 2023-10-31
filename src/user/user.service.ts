import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateProfile(userId: number, fullname: string, imageUrl: string) {
    if (imageUrl) {
      return this.databaseService.user.update({
        where: {
          id: userId,
        },
        data: {
          fullname: fullname,
          avatarUrl: imageUrl,
        },
      });
    }

    return this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        fullname: fullname,
      },
    });
  }
}

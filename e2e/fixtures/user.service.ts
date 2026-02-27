import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { NodeLoader } from '../../src/decorators/node-loader.decorator';

@Injectable()
export class UserService {
  private users: Map<string, User> = new Map([
    [
      '1',
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    ],
    [
      '2',
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    [
      '3',
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
      },
    ],
  ]);

  @NodeLoader(() => User)
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

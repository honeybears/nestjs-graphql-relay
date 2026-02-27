import { Injectable } from '@nestjs/common';
import { Post } from './post.entity';
import { NodeLoader } from '../../src/decorators/node-loader.decorator';

@Injectable()
export class PostService {
  private posts: Map<string, Post> = new Map([
    [
      '1',
      {
        id: '1',
        title: 'First Post',
        content: 'This is the first post content',
        authorId: '1',
      },
    ],
    [
      '2',
      {
        id: '2',
        title: 'Second Post',
        content: 'This is the second post content',
        authorId: '1',
      },
    ],
    [
      '3',
      {
        id: '3',
        title: 'Third Post',
        content: 'This is the third post content',
        authorId: '2',
      },
    ],
  ]);

  @NodeLoader(() => Post)
  async findById(id: string): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async findAll(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }
}

import { Injectable } from '@nestjs/common';
import { Comment } from './comment.entity';
import { NodeLoader } from '../../src/decorators/node-loader.decorator';

@Injectable()
export class CommentService {
  private comments: Map<string, Comment> = new Map([
    [
      '1',
      {
        id: '1',
        body: 'Great post!',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        authorId: '1',
      },
    ],
    [
      '2',
      {
        id: '2',
        body: 'Very informative, thanks!',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
        authorId: '2',
      },
    ],
    [
      '3',
      {
        id: '3',
        body: 'I disagree with this.',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z',
        authorId: '3',
      },
    ],
  ]);

  @NodeLoader(() => Comment)
  async findById(id: string): Promise<Comment | null> {
    return this.comments.get(id) || null;
  }

  async findAll(): Promise<Comment[]> {
    return Array.from(this.comments.values());
  }
}

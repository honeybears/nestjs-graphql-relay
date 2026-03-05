import { Query, Resolver, Args } from '@nestjs/graphql';
import { SearchResult } from './search-result.union';
import { Notification } from './notification.union';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Alert } from './alert.entity';
import { UserService } from './user.service';
import { PostService } from './post.service';
import { CommentService } from './comment.service';

@Resolver()
export class UnionResolver {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly commentService: CommentService,
  ) {}

  @Query(() => [SearchResult])
  async search(
    @Args('term', { type: () => String }) term: string,
  ): Promise<Array<User | Post | Comment>> {
    const [users, posts, comments] = await Promise.all([
      this.userService.findAll(),
      this.postService.findAll(),
      this.commentService.findAll(),
    ]);

    const results: Array<User | Post | Comment> = [];

    for (const user of users) {
      if (user.name.toLowerCase().includes(term.toLowerCase())) {
        results.push({ ...user, __typename: 'User' } as User);
      }
    }
    for (const post of posts) {
      if (post.title.toLowerCase().includes(term.toLowerCase())) {
        results.push({ ...post, __typename: 'PostNode' } as Post);
      }
    }
    for (const comment of comments) {
      if (comment.body.toLowerCase().includes(term.toLowerCase())) {
        results.push({ ...comment, __typename: 'Comment' } as Comment);
      }
    }

    return results;
  }

  @Query(() => [Notification])
  async notifications(): Promise<Array<Comment | Alert>> {
    const comments = await this.commentService.findAll();

    const alerts: Alert[] = [
      { message: 'System maintenance scheduled', severity: 'info', __typename: 'Alert' } as Alert,
      { message: 'Disk usage above 90%', severity: 'warning', __typename: 'Alert' } as Alert,
    ];

    const mixed: Array<Comment | Alert> = [
      { ...comments[0], __typename: 'Comment' } as Comment,
      alerts[0],
      { ...comments[1], __typename: 'Comment' } as Comment,
      alerts[1],
    ];

    return mixed;
  }
}

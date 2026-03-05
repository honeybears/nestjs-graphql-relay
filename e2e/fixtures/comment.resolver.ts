import { Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Comment } from './comment.entity';
import { User } from './user.entity';
import { CommentService } from './comment.service';
import { UserService } from './user.service';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    private readonly userService: UserService,
  ) {}

  @Query(() => [Comment])
  async comments(): Promise<Comment[]> {
    return this.commentService.findAll();
  }

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() comment: Comment): Promise<User | null> {
    if (!comment.authorId) {
      return null;
    }
    return this.userService.findById(comment.authorId);
  }
}

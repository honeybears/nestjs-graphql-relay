import { Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Post } from './post.entity';
import { User } from './user.entity';
import { PostService } from './post.service';
import { UserService } from './user.service';

@Resolver(() => Post)
export class PostResolver {
  constructor(
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return this.postService.findAll();
  }

  @Query(() => Post, { nullable: true })
  async post(@Parent() id: string): Promise<Post | null> {
    return this.postService.findById(id);
  }

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() post: Post): Promise<User | null> {
    if (!post.authorId) {
      return null;
    }
    return this.userService.findById(post.authorId);
  }
}

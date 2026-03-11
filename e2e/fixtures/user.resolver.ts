import {
  Query,
  Resolver,
  ResolveField,
  Parent,
  Args,
  ID,
} from '@nestjs/graphql';
import { User } from './user.entity';
import { Post } from './post.entity';
import { UserService } from './user.service';
import { PostService } from './post.service';
import { ParseGlobalIdPipe } from 'src/pipe/parse-global-id.pipe';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(
    @Args({ name: 'id', type: () => ID }, ParseGlobalIdPipe) id: string,
  ): Promise<User | null> {
    return this.userService.findById(id);
  }

  @ResolveField(() => [Post])
  async posts(@Parent() user: User): Promise<Post[]> {
    const result = await this.postService.findAll();
    return result;
  }
}

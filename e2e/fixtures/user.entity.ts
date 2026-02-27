import { Field, ObjectType } from '@nestjs/graphql';
import { NodeInterface } from '../../src/interfaces/node.interface';
import { Post } from './post.entity';

@ObjectType('User', { implements: () => [NodeInterface] })
export class User extends NodeInterface {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  email!: string;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];
}

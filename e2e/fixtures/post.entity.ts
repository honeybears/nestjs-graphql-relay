import { Field, ObjectType } from '@nestjs/graphql';
import { NodeInterface } from '../../src/interfaces/node.interface';
import { User } from './user.entity';

/**
 * Named PostNode to test typename resolution
 */
@ObjectType('PostNode', { implements: () => [NodeInterface] })
export class Post extends NodeInterface {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  content!: string;

  @Field(() => User, { nullable: true })
  author?: User;

  // Internal field for storing author ID (not exposed in GraphQL)
  authorId?: string;
}

import { Field, ObjectType } from '@nestjs/graphql';
import { NodeInterface } from '../../src/interfaces/node.interface';
import { TimestampedInterface } from './timestamped.interface';
import { User } from './user.entity';

/**
 * Comment implements both Node and Timestamped interfaces
 * to test multiple interface inheritance scenario.
 */
@ObjectType('Comment', {
  implements: () => [NodeInterface, TimestampedInterface],
})
export class Comment extends NodeInterface {
  @Field(() => String)
  body!: string;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  updatedAt!: string;

  @Field(() => User, { nullable: true })
  author?: User;

  // Internal field (not exposed in GraphQL)
  authorId?: string;
}

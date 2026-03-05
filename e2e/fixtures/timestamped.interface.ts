import { Field, InterfaceType } from '@nestjs/graphql';

@InterfaceType('Timestamped')
export abstract class TimestampedInterface {
  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  updatedAt!: string;
}

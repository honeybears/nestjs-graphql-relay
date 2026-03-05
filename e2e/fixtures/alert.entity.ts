import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Alert does NOT implement Node — used to test Union members
 * that are not part of the Relay Node interface.
 */
@ObjectType('Alert')
export class Alert {
  @Field(() => String)
  message!: string;

  @Field(() => String)
  severity!: string;
}

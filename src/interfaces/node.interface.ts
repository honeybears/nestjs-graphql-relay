import { Field, ID, InterfaceType } from '@nestjs/graphql';

@InterfaceType('Node', {
  resolveType: value => {
    return value.__typename;
  },
})
export abstract class NodeInterface {
  @Field(() => ID)
  id!: string;
}

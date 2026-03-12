import { Field, ID, InterfaceType } from '@nestjs/graphql';
import { GlobalIdSerializeMiddleware } from 'src/middlewares/global-id-serialize.middleware';

@InterfaceType('Node', {
  resolveType: value => {
    return value.__typename;
  },
})
export abstract class NodeInterface {
  @Field(() => ID, { middleware: [GlobalIdSerializeMiddleware] })
  id!: string;
}

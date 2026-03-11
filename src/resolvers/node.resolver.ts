import { Query, Args, Resolver, ID } from '@nestjs/graphql';
import { NodeInterface } from 'src/interfaces/node.interface';
import { GlobalIdStrategyRegistry } from 'src/services/global-id.registry';
import { GlobalIdStrategy } from 'src/services/global-id.strategy';
import { NodeLoaderRegistry } from 'src/services/node-loader.registry';

@Resolver(() => NodeInterface)
export class NodeResolver {
  private readonly globalIdStrategy: GlobalIdStrategy;

  constructor(private readonly nodeLoaderRegistry: NodeLoaderRegistry) {
    this.globalIdStrategy = GlobalIdStrategyRegistry.get();
  }

  @Query(() => NodeInterface, { name: 'node', nullable: true })
  async node(@Args({ name: 'id', type: () => ID }) id: string): Promise<any> {
    const globalId = this.globalIdStrategy.parse(id);
    const nodeLoader = this.nodeLoaderRegistry.getLoader(globalId.typename);

    if (!nodeLoader) {
      throw new Error(`Node loader not found for type ${globalId.typename}`);
    }

    const result = await nodeLoader.instance[nodeLoader.methodName](
      globalId.id,
    );

    if (!result) {
      return null;
    }

    return Object.assign(result, {
      __typename: globalId.typename,
    });
  }
}

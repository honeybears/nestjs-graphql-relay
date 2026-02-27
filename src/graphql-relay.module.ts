import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { NodeResolver } from './resolvers/node.resolver';
import { GlobalIdStrategy } from './services/global-id.strategy';
import { GlobalIdStrategyRegistry } from './services/global-id.registry';
import { NodeLoaderExplorer } from './services/node-loader.explorer';
import { NodeLoaderRegistry } from './services/node-loader.registry';

@Module({})
export class GraphQLRelayModule {
  static forRoot(options: GraphQLRelayModuleOptions): DynamicModule {
    return {
      global: true,
      module: GraphQLRelayModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: GRAPHQL_RELAY_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: GlobalIdStrategyRegistry,
          useFactory: (opts: GraphQLRelayModuleOptions) => {
            return new GlobalIdStrategyRegistry(opts);
          },
          inject: [GRAPHQL_RELAY_MODULE_OPTIONS],
        },
        {
          provide: NodeLoaderRegistry,
          useFactory: (opts: GraphQLRelayModuleOptions) => {
            return new NodeLoaderRegistry(opts);
          },
          inject: [GRAPHQL_RELAY_MODULE_OPTIONS],
        },
        NodeLoaderExplorer,
        NodeResolver,
      ],
      exports: [
        GRAPHQL_RELAY_MODULE_OPTIONS,
        GlobalIdStrategyRegistry,
        NodeLoaderRegistry,
        NodeLoaderExplorer,
      ],
    };
  }
}

export const GRAPHQL_RELAY_MODULE_OPTIONS = 'GRAPHQL_RELAY_MODULE_OPTIONS';

export interface GraphQLRelayModuleOptions {
  types: Function[];
  globalIdStrategy?: GlobalIdStrategy;
}

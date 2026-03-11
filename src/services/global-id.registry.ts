import { Inject, Injectable } from '@nestjs/common';
import {
  GRAPHQL_RELAY_MODULE_OPTIONS,
  GraphQLRelayModuleOptions,
} from 'src/graphql-relay.module';
import {
  DefaultGlobalIdStrategy,
  GlobalIdStrategy,
} from './global-id.strategy';

@Injectable()
export class GlobalIdStrategyRegistry {
  private static strategy: GlobalIdStrategy = new DefaultGlobalIdStrategy();

  constructor(
    @Inject(GRAPHQL_RELAY_MODULE_OPTIONS)
    options?: GraphQLRelayModuleOptions,
  ) {
    GlobalIdStrategyRegistry.strategy =
      options?.globalIdStrategy ?? new DefaultGlobalIdStrategy();
  }

  static get(): GlobalIdStrategy {
    return GlobalIdStrategyRegistry.strategy;
  }
}

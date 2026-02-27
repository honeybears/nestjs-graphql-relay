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
  private strategy: GlobalIdStrategy;
  constructor(
    @Inject(GRAPHQL_RELAY_MODULE_OPTIONS)
    options: GraphQLRelayModuleOptions,
  ) {
    this.strategy = options.globalIdStrategy ?? new DefaultGlobalIdStrategy();
  }

  get(): GlobalIdStrategy {
    return this.strategy;
  }

  set(strategy: GlobalIdStrategy) {
    this.strategy = strategy;
  }
}

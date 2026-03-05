export { GraphQLRelayModule } from './graphql-relay.module';
export type { GraphQLRelayModuleOptions } from './graphql-relay.module';

export { NodeLoader } from './decorators/node-loader.decorator';
export type { NodeLoaderTargetType } from './decorators/node-loader.decorator';

export { NodeInterface } from './interfaces/node.interface';

export {
  DefaultGlobalIdStrategy,
  InvalidGlobalIdException,
} from './services/global-id.strategy';
export type { GlobalId, GlobalIdStrategy } from './services/global-id.strategy';

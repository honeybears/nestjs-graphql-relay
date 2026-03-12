import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';
import { GlobalIdStrategyRegistry } from 'src/services/global-id.registry';

/**
 * Field middleware that automatically serializes internal IDs to Global IDs
 * for types that implement NodeInterface
 */
export const GlobalIdSerializeMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();

  // If no value, return as-is
  if (value === null || value === undefined) {
    return value;
  }

  const globalIdStrategy = GlobalIdStrategyRegistry.get();

  // Get the typename from the parent object
  const typename = ctx.source?.__typename || ctx.info.parentType.name;

  // Serialize the ID
  return globalIdStrategy.serialize(typename, value);
};

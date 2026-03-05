import { createUnionType } from '@nestjs/graphql';
import { Comment } from './comment.entity';
import { Alert } from './alert.entity';

/**
 * Union of mixed types: Comment (implements Node) and Alert (does not).
 * Tests that union resolution works even when member types differ
 * in their interface implementations.
 */
export const Notification = createUnionType({
  name: 'Notification',
  types: () => [Comment, Alert] as const,
  resolveType(value) {
    return value.__typename;
  },
});

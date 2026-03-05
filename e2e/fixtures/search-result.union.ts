import { createUnionType } from '@nestjs/graphql';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

/**
 * Union of types that all implement Node.
 * Tests that node(id) resolution still works correctly
 * for types accessed through a union.
 */
export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [User, Post, Comment] as const,
  resolveType(value) {
    return value.__typename;
  },
});

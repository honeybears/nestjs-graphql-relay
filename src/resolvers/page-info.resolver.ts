import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PageInfo } from 'src/interfaces/edge.interface';

@Resolver(() => PageInfo)
export class PageInfoResolver {
  @ResolveField(() => Boolean)
  hasNextPage(@Parent() pageInfo: PageInfo): boolean {
    return pageInfo.hasNextPage;
  }

  @ResolveField(() => Boolean)
  hasPreviousPage(@Parent() pageInfo: PageInfo): boolean {
    return pageInfo.hasPreviousPage;
  }

  @ResolveField(() => String, { nullable: true })
  startCursor(@Parent() pageInfo: PageInfo): string | null {
    return pageInfo.startCursor ?? null;
  }

  @ResolveField(() => String, { nullable: true })
  endCursor(@Parent() pageInfo: PageInfo): string | null {
    return pageInfo.endCursor ?? null;
  }
}

import { NodeInterface } from 'src/interfaces/node.interface';
import { Edge, IEdge } from './edge.generator';
import { Type } from '@nestjs/common';
import {
  Directive,
  Field,
  ObjectType,
  TypeMetadataStorage,
  ArgsType,
  Int,
} from '@nestjs/graphql';

export type Edges<T extends NodeInterface> = (IEdge<T> | null | undefined)[];

export interface IConnection<T extends NodeInterface> {
  edges?: Edges<T>;
  pageInfo: PageInfo;
  totalCount?: number;
}

@ObjectType('PageInfo')
@Directive('@shareable')
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage!: boolean;
  @Field(() => Boolean)
  hasPreviousPage!: boolean;
  @Field(() => String, { nullable: true })
  startCursor?: string | null;
  @Field(() => String, { nullable: true })
  endCursor?: string | null;
}

export function Connection<T extends NodeInterface>(
  nodeType: Type<T>,
  connectionName?: string,
): Type<IConnection<T>> {
  const metadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(nodeType);

  const baseName = connectionName ?? metadata?.name ?? nodeType.name;
  const finalConnectionName = baseName.endsWith('Connection')
    ? baseName
    : `${baseName}Connection`;

  @ObjectType(finalConnectionName, { isAbstract: true })
  class ConnectionClass implements IConnection<T> {
    @Field(() => [Edge(nodeType)], { nullable: 'itemsAndList' })
    edges?: Edges<T>;

    @Field(() => PageInfo)
    pageInfo!: PageInfo;

    @Field(() => Int, { nullable: true })
    totalCount?: number;
  }

  return ConnectionClass;
}

@ArgsType()
export class DefaultConnectionArgs {
  @Field(() => String, { nullable: true })
  after?: string;
  @Field(() => String, { nullable: true })
  before?: string;
  @Field(() => Int, { nullable: true })
  first?: number;
  @Field(() => Int, { nullable: true })
  last?: number;
}

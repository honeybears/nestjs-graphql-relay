import { Type } from '@nestjs/common';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

export function Edge<T>(
  classRef: Type<T>,
  edgeName?: string,
): Type<EdgeType<T>> {
  const name = edgeName ?? `${classRef.name}Edge`;

  @ObjectType(name, { isAbstract: true })
  abstract class Edge {
    @Field(() => String)
    cursor: string;

    @Field(() => classRef, { nullable: true })
    node?: T;
  }

  return Edge as Type<EdgeType<T>>;
}

export function Connection<T>(
  classRef: Type<T>,
  connectionName?: string,
): Type<ConnectionType<T>> {
  const name = connectionName ?? `${classRef.name}Connection`;

  const GeneratedEdge = Edge(classRef);

  @ObjectType(name, { isAbstract: true })
  abstract class Connection {
    @Field(() => [GeneratedEdge], { nullable: 'itemsAndList' })
    edges?: EdgeType<T | null>[];

    @Field(() => PageInfo, { nullable: true })
    pageInfo?: PageInfo;

    @Field(() => Int, { nullable: true })
    totalCount?: number;
  }

  return Connection as Type<ConnectionType<T>>;
}

@ArgsType()
export class ConnectionArgs {
  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string;

  @Field(() => Int, { nullable: true })
  last?: number;

  @Field(() => String, { nullable: true })
  before?: string;
}

@ObjectType()
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

export interface EdgeType<T> {
  cursor: string;
  node?: T;
}

export interface ConnectionType<T> {
  edges?: EdgeType<T | null>[];
  pageInfo?: PageInfo;
  totalCount?: number;
}

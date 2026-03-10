import { Type } from '@nestjs/common';
import { Field, ObjectType, TypeMetadataStorage } from '@nestjs/graphql';
import { NodeInterface } from 'src/interfaces/node.interface';

export interface IEdge<T extends NodeInterface> {
  node?: T | null;
  cursor: string;
}

export function Edge<T extends NodeInterface>(
  nodeType: Type<T>,
  edgeName?: string,
): Type<IEdge<T>> {
  const metadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(nodeType);

  const baseName = edgeName ?? metadata?.name ?? nodeType.name;
  const finalEdgeName = baseName.endsWith('Edge')
    ? baseName
    : `${baseName}Edge`;

  @ObjectType(finalEdgeName, { isAbstract: true })
  class EdgeClass implements IEdge<T> {
    @Field(() => nodeType, { nullable: true })
    node?: T | null;

    @Field(() => String)
    cursor!: string;
  }

  return EdgeClass;
}

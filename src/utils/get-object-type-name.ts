import { Type } from '@nestjs/common';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage';

export function getObjectTypeName(target: Type): string {
  const objectTypes = TypeMetadataStorage.getObjectTypeMetadataByTarget(target);

  return objectTypes?.name ?? target.name;
}

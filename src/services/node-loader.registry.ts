import { Injectable } from '@nestjs/common';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage';
import { Type } from '@nestjs/common';
import { getObjectTypeName } from 'src/utils/get-object-type-name';

export interface NodeLoaderWrapper {
  type: Type;
  instance: any;
  methodName: string;
}

@Injectable()
export class NodeLoaderRegistry {
  private readonly nodeLoaders: Map<string, NodeLoaderWrapper> = new Map();

  register(nodeLoader: NodeLoaderWrapper) {
    const typeMetadatas = TypeMetadataStorage.getObjectTypesMetadata();

    if (
      !typeMetadatas.some(
        typeMetadata => typeMetadata.target === nodeLoader.type,
      )
    ) {
      throw new Error(`Type ${nodeLoader.type.name} not found in options`);
    }

    const typeName = getObjectTypeName(nodeLoader.type);

    if (this.nodeLoaders.has(typeName)) {
      throw new Error(`Duplicate node loader for type ${nodeLoader.type.name}`);
    }

    this.nodeLoaders.set(typeName, nodeLoader);
  }

  getLoader(typeName: string): NodeLoaderWrapper | undefined {
    return this.nodeLoaders.get(typeName);
  }
}

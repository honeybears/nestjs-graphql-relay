import { Inject, Injectable } from '@nestjs/common';
import { GRAPHQL_RELAY_MODULE_OPTIONS } from 'src/graphql-relay.module';
import { GraphQLRelayModuleOptions } from 'src/graphql-relay.module';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage';
import { Type } from '@nestjs/common';

export interface NodeLoaderWrapper {
  type: Type;
  instance: any;
  methodName: string;
}

@Injectable()
export class NodeLoaderRegistry {
  private readonly nodeLoaders: Map<string, NodeLoaderWrapper> = new Map();

  constructor(
    @Inject(GRAPHQL_RELAY_MODULE_OPTIONS)
    private readonly options: GraphQLRelayModuleOptions,
  ) {}

  register(nodeLoader: NodeLoaderWrapper) {
    const { types } = this.options;

    if (!types.includes(nodeLoader.type)) {
      throw new Error(`Type ${nodeLoader.type.name} not found in options`);
    }

    const typeName = this.getObjectTypeName(nodeLoader.type);

    if (this.nodeLoaders.has(typeName)) {
      throw new Error(`Duplicate node loader for type ${nodeLoader.type.name}`);
    }

    this.nodeLoaders.set(typeName, nodeLoader);
  }

  getLoader(typeName: string): NodeLoaderWrapper | undefined {
    return this.nodeLoaders.get(typeName);
  }

  getObjectTypeName(traget: Type): string {
    const objecTypes =
      TypeMetadataStorage.getObjectTypeMetadataByTarget(traget);

    return objecTypes?.name ?? traget.name;
  }
}

import { SetMetadata, Type } from '@nestjs/common';

export const NODE_LOADER_METADATA = 'NODE_LOADER_METADATA';

export type NodeLoaderMetadata  = () => Type;

export const NodeLoader = (metadata: NodeLoaderMetadata): MethodDecorator => {
  return (target, key, descriptor) => {
    return SetMetadata(NODE_LOADER_METADATA, metadata)(target, key, descriptor);
  };
};

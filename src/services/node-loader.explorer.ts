import { DiscoveryService } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  NODE_LOADER_METADATA,
  NodeLoaderMetadata,
} from 'src/decorators/node-loader.decorator';
import { MetadataScanner } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { NodeLoaderRegistry } from './node-loader.registry';

@Injectable()
export class NodeLoaderExplorer implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly nodeLoaderRegistry: NodeLoaderRegistry,
  ) {}

  explore(): void {
    const providers = this.discoveryService.getProviders();
    providers.forEach(provider => {
      const instance = provider.instance;
      if (!instance || !Object.getPrototypeOf(instance)) return;

      this.metadataScanner
        .getAllMethodNames(Object.getPrototypeOf(instance))
        .forEach(methodName => {
          const metadata = this.reflector.get<NodeLoaderMetadata>(
            NODE_LOADER_METADATA,
            instance[methodName],
          );
          if (metadata) {
            this.nodeLoaderRegistry.register({
              type: metadata(),
              instance: instance,
              methodName,
            });
          }
        });
    });
  }

  onModuleInit() {
    this.explore();
  }
}

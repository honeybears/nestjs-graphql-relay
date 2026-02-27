import { NodeLoaderExplorer } from './node-loader.explorer';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { NodeLoaderRegistry } from './node-loader.registry';
import { NodeInterface } from 'src/interfaces/node.interface';

class UserNode extends NodeInterface {
  name!: string;
}

class PostNode extends NodeInterface {
  title!: string;
}

describe('NodeLoaderExplorer', () => {
  let explorer: NodeLoaderExplorer;
  let discoveryService: jest.Mocked<DiscoveryService>;
  let metadataScanner: jest.Mocked<MetadataScanner>;
  let reflector: jest.Mocked<Reflector>;
  let nodeLoaderRegistry: jest.Mocked<NodeLoaderRegistry>;

  beforeEach(() => {
    discoveryService = {
      getProviders: jest.fn(),
    } as any;

    metadataScanner = {
      getAllMethodNames: jest.fn(),
    } as any;

    reflector = {
      get: jest.fn(),
    } as any;

    nodeLoaderRegistry = {
      register: jest.fn(),
      getLoader: jest.fn(),
    } as any;

    explorer = new NodeLoaderExplorer(
      discoveryService,
      metadataScanner,
      reflector,
      nodeLoaderRegistry,
    );
  });

  describe('explore', () => {
    it('should register node loaders with metadata', () => {
      const mockInstance = {
        loadUser: jest.fn(),
        loadPost: jest.fn(),
      };

      const mockProvider = {
        instance: mockInstance,
      };

      discoveryService.getProviders.mockReturnValue([mockProvider] as any);
      metadataScanner.getAllMethodNames.mockReturnValue([
        'loadUser',
        'loadPost',
      ]);

      reflector.get.mockImplementation((_key, target) => {
        if (target === mockInstance.loadUser) {
          return () => UserNode;
        }
        if (target === mockInstance.loadPost) {
          return () => PostNode;
        }
        return undefined;
      });

      explorer.explore();

      expect(discoveryService.getProviders).toHaveBeenCalled();
      expect(metadataScanner.getAllMethodNames).toHaveBeenCalledWith(
        Object.getPrototypeOf(mockInstance),
      );
      expect(nodeLoaderRegistry.register).toHaveBeenCalledTimes(2);
      expect(nodeLoaderRegistry.register).toHaveBeenCalledWith({
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      });
      expect(nodeLoaderRegistry.register).toHaveBeenCalledWith({
        type: PostNode,
        instance: mockInstance,
        methodName: 'loadPost',
      });
    });

    it('should skip providers without instance', () => {
      const mockProvider = {
        instance: null,
      };

      discoveryService.getProviders.mockReturnValue([mockProvider] as any);

      explorer.explore();

      expect(metadataScanner.getAllMethodNames).not.toHaveBeenCalled();
      expect(nodeLoaderRegistry.register).not.toHaveBeenCalled();
    });

    it('should skip providers without prototype', () => {
      const mockProvider = {
        instance: Object.create(null),
      };

      discoveryService.getProviders.mockReturnValue([mockProvider] as any);

      explorer.explore();

      expect(metadataScanner.getAllMethodNames).not.toHaveBeenCalled();
      expect(nodeLoaderRegistry.register).not.toHaveBeenCalled();
    });

    it('should skip methods without metadata', () => {
      const mockInstance = {
        loadUser: jest.fn(),
        otherMethod: jest.fn(),
      };

      const mockProvider = {
        instance: mockInstance,
      };

      discoveryService.getProviders.mockReturnValue([mockProvider] as any);
      metadataScanner.getAllMethodNames.mockReturnValue([
        'loadUser',
        'otherMethod',
      ]);

      reflector.get.mockImplementation((_key, target) => {
        if (target === mockInstance.loadUser) {
          return () => UserNode;
        }
        return undefined;
      });
    });

    it('should handle multiple providers', () => {
      const mockInstance1 = { loadUser: jest.fn() };
      const mockInstance2 = { loadPost: jest.fn() };

      discoveryService.getProviders.mockReturnValue([
        { instance: mockInstance1 },
        { instance: mockInstance2 },
      ] as any);

      metadataScanner.getAllMethodNames
        .mockReturnValueOnce(['loadUser'])
        .mockReturnValueOnce(['loadPost']);

      reflector.get.mockImplementation((_key, target) => {
        if (target === mockInstance1.loadUser) {
          return () => UserNode;
        }
        if (target === mockInstance2.loadPost) {
          return () => PostNode;
        }
        return undefined;
      });

      explorer.explore();

      expect(nodeLoaderRegistry.register).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleInit', () => {
    it('should call explore on module init', () => {
      const exploreSpy = jest.spyOn(explorer, 'explore');
      exploreSpy.mockImplementation(() => {});

      explorer.onModuleInit();

      expect(exploreSpy).toHaveBeenCalled();
    });
  });
});

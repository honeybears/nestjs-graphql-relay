import { NodeResolver } from './node.resolver';
import { GlobalIdStrategyRegistry } from 'src/services/global-id.registry';
import { NodeLoaderRegistry } from 'src/services/node-loader.registry';

describe('NodeResolver', () => {
  let resolver: NodeResolver;
  let globalIdStrategyRegistry: jest.Mocked<GlobalIdStrategyRegistry>;
  let nodeLoaderRegistry: jest.Mocked<NodeLoaderRegistry>;
  let defaultMockStrategy: any;

  beforeEach(() => {
    defaultMockStrategy = {
      parse: jest.fn(),
      serialize: jest.fn(),
    };

    globalIdStrategyRegistry = {
      get: jest.fn().mockReturnValue(defaultMockStrategy),
      set: jest.fn(),
    } as any;

    nodeLoaderRegistry = {
      register: jest.fn(),
      getLoader: jest.fn(),
    } as any;

    resolver = new NodeResolver(globalIdStrategyRegistry, nodeLoaderRegistry);
  });

  describe('node', () => {
    it('should resolve node successfully', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'User',
        id: '123',
      });
      defaultMockStrategy.serialize.mockReturnValue('VXNlcjoxMjM=');

      const mockLoader = {
        type: class User {},
        instance: {
          loadUser: jest.fn().mockResolvedValue({
            id: '123',
            name: 'John Doe',
          }),
        },
        methodName: 'loadUser',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      const result = await resolver.node('encoded-id');

      expect(defaultMockStrategy.parse).toHaveBeenCalledWith('encoded-id');
      expect(nodeLoaderRegistry.getLoader).toHaveBeenCalledWith('User');
      expect(mockLoader.instance.loadUser).toHaveBeenCalledWith('123');
      expect(defaultMockStrategy.serialize).toHaveBeenCalledWith('User', '123');
      expect(result).toEqual({
        id: 'VXNlcjoxMjM=',
        name: 'John Doe',
        __typename: 'User',
      });
    });

    it('should throw error when node loader not found', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'NonExistent',
        id: '123',
      });

      nodeLoaderRegistry.getLoader.mockReturnValue(undefined);

      await expect(resolver.node('encoded-id')).rejects.toThrow(
        'Node loader not found for type NonExistent',
      );
    });

    it('should return null when loader returns null', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'User',
        id: '999',
      });

      const mockLoader = {
        type: class User {},
        instance: {
          loadUser: jest.fn().mockResolvedValue(null),
        },
        methodName: 'loadUser',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      const result = await resolver.node('encoded-id');

      expect(result).toBeNull();
    });

    it('should return null when loader returns undefined', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'User',
        id: '999',
      });

      const mockLoader = {
        type: class User {},
        instance: {
          loadUser: jest.fn().mockResolvedValue(undefined),
        },
        methodName: 'loadUser',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      const result = await resolver.node('encoded-id');

      expect(result).toBeNull();
    });

    it('should handle synchronous loaders', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'Post',
        id: '456',
      });
      defaultMockStrategy.serialize.mockReturnValue('UG9zdDo0NTY=');

      const mockLoader = {
        type: class Post {},
        instance: {
          loadPost: jest.fn().mockReturnValue({
            id: '456',
            title: 'Test Post',
          }),
        },
        methodName: 'loadPost',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      const result = await resolver.node('encoded-id');

      expect(defaultMockStrategy.serialize).toHaveBeenCalledWith('Post', '456');
      expect(result).toEqual({
        id: 'UG9zdDo0NTY=',
        title: 'Test Post',
        __typename: 'Post',
      });
    });

    it('should propagate errors from global id parsing', async () => {
      defaultMockStrategy.parse.mockImplementation(() => {
        throw new Error('Invalid global ID');
      });

      await expect(resolver.node('invalid-id')).rejects.toThrow(
        'Invalid global ID',
      );
    });

    it('should propagate errors from loader', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'User',
        id: '123',
      });

      const mockLoader = {
        type: class User {},
        instance: {
          loadUser: jest.fn().mockRejectedValue(new Error('Database error')),
        },
        methodName: 'loadUser',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      await expect(resolver.node('encoded-id')).rejects.toThrow(
        'Database error',
      );
    });

    it('should preserve all properties from loaded node', async () => {
      defaultMockStrategy.parse.mockReturnValue({
        typename: 'User',
        id: '123',
      });
      defaultMockStrategy.serialize.mockReturnValue('VXNlcjoxMjM=');

      const mockLoader = {
        type: class User {},
        instance: {
          loadUser: jest.fn().mockResolvedValue({
            id: '123',
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 30,
          }),
        },
        methodName: 'loadUser',
      };

      nodeLoaderRegistry.getLoader.mockReturnValue(mockLoader);

      const result = await resolver.node('encoded-id');

      expect(defaultMockStrategy.serialize).toHaveBeenCalledWith('User', '123');
      expect(result).toEqual({
        id: 'VXNlcjoxMjM=',
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 30,
        __typename: 'User',
      });
    });
  });
});

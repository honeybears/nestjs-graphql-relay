import { NodeLoaderRegistry } from './node-loader.registry';
import { NodeInterface } from 'src/interfaces/node.interface';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage';
import { ObjectType } from '@nestjs/graphql';

jest.mock('@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage');

@ObjectType('UserNode', { implements: () => [NodeInterface] })
class UserNode extends NodeInterface {
  name!: string;
}

@ObjectType('PostNode', { implements: () => [NodeInterface] })
class PostNode extends NodeInterface {
  title!: string;
}

@ObjectType('CustomName', { implements: () => [NodeInterface] })
class CustomNameNode extends NodeInterface {
  value!: string;
}

describe('NodeLoaderRegistry', () => {
  let registry: NodeLoaderRegistry;
  const mockInstance = { loadUser: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (
      TypeMetadataStorage.getObjectTypesMetadata as jest.Mock
    ).mockReturnValue([
      { target: UserNode },
      { target: PostNode },
      { target: CustomNameNode },
    ]);
    (
      TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
    ).mockReturnValue(undefined);
  });

  describe('register', () => {
    it('should register a node loader successfully', () => {
      registry = new NodeLoaderRegistry();

      expect(() => {
        registry.register({
          type: UserNode,
          instance: mockInstance,
          methodName: 'loadUser',
        });
      }).not.toThrow();
    });

    it('should throw error when type is not in options', () => {
      (
        TypeMetadataStorage.getObjectTypesMetadata as jest.Mock
      ).mockReturnValue([]);

      registry = new NodeLoaderRegistry();

      expect(() => {
        registry.register({
          type: PostNode,
          instance: mockInstance,
          methodName: 'loadPost',
        });
      }).toThrow('Type PostNode not found in options');
    });

    it('should throw error when duplicate loader is registered', () => {
      registry = new NodeLoaderRegistry();

      registry.register({
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      });

      expect(() => {
        registry.register({
          type: UserNode,
          instance: mockInstance,
          methodName: 'loadUserAgain',
        });
      }).toThrow('Duplicate node loader for type UserNode');
    });

    it('should allow registering multiple different types', () => {
      registry = new NodeLoaderRegistry();

      registry.register({
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      });

      expect(() => {
        registry.register({
          type: PostNode,
          instance: mockInstance,
          methodName: 'loadPost',
        });
      }).not.toThrow();
    });

    it('should register loader with GraphQL ObjectType name when available', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockReturnValue({
        name: 'User',
      });

      registry = new NodeLoaderRegistry();

      const loader = {
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      };

      registry.register(loader);

      // Should be retrievable by GraphQL ObjectType name
      expect(registry.getLoader('User')).toEqual(loader);
      // Should NOT be retrievable by class name when ObjectType name is different
      expect(registry.getLoader('UserNode')).toBeUndefined();
    });
  });

  describe('getLoader', () => {
    beforeEach(() => {
      registry = new NodeLoaderRegistry();
    });

    it('should return registered loader by type name', () => {
      const userLoader = {
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      };

      registry.register(userLoader);

      const result = registry.getLoader('UserNode');
      expect(result).toEqual(userLoader);
    });

    it('should return undefined for non-existent loader', () => {
      const result = registry.getLoader('NonExistent');
      expect(result).toBeUndefined();
    });

    it('should return correct loader when multiple are registered', () => {
      const userLoader = {
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      };

      const postLoader = {
        type: PostNode,
        instance: { loadPost: jest.fn() },
        methodName: 'loadPost',
      };

      registry.register(userLoader);
      registry.register(postLoader);

      expect(registry.getLoader('UserNode')).toEqual(userLoader);
      expect(registry.getLoader('PostNode')).toEqual(postLoader);
    });

    it('should return loader by GraphQL ObjectType name', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockImplementation(target => {
        if (target === UserNode) {
          return { name: 'User' };
        }
        if (target === PostNode) {
          return { name: 'Post' };
        }
        return undefined;
      });

      registry = new NodeLoaderRegistry();

      const userLoader = {
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      };

      const postLoader = {
        type: PostNode,
        instance: { loadPost: jest.fn() },
        methodName: 'loadPost',
      };

      registry.register(userLoader);
      registry.register(postLoader);

      // Should be retrievable by GraphQL ObjectType names
      expect(registry.getLoader('User')).toEqual(userLoader);
      expect(registry.getLoader('Post')).toEqual(postLoader);
    });
  });

  describe('getObjectTypeName', () => {
    beforeEach(() => {
      registry = new NodeLoaderRegistry();
    });

    it('should return GraphQL ObjectType name when available', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockReturnValue({
        name: 'User',
      });

      const result = registry.getObjectTypeName(UserNode);
      expect(result).toBe('User');
      expect(
        TypeMetadataStorage.getObjectTypeMetadataByTarget,
      ).toHaveBeenCalledWith(UserNode);
    });

    it('should return class name when GraphQL ObjectType is not available', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockReturnValue(undefined);

      const result = registry.getObjectTypeName(UserNode);
      expect(result).toBe('UserNode');
    });

    it('should return class name when GraphQL ObjectType name is not set', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockReturnValue({
        name: undefined,
      });

      const result = registry.getObjectTypeName(UserNode);
      expect(result).toBe('UserNode');
    });

    it('should handle different types with different GraphQL names', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockImplementation(target => {
        if (target === UserNode) {
          return { name: 'User' };
        }
        if (target === PostNode) {
          return { name: 'Post' };
        }
        if (target === CustomNameNode) {
          return { name: 'CustomEntity' };
        }
        return undefined;
      });

      expect(registry.getObjectTypeName(UserNode)).toBe('User');
      expect(registry.getObjectTypeName(PostNode)).toBe('Post');
      expect(registry.getObjectTypeName(CustomNameNode)).toBe('CustomEntity');
    });
  });

  describe('integration with GraphQL ObjectType names', () => {
    it('should prevent duplicate registration with same GraphQL ObjectType name', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockReturnValue({
        name: 'User',
      });

      registry = new NodeLoaderRegistry();

      registry.register({
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      });

      expect(() => {
        registry.register({
          type: UserNode,
          instance: { loadUserAgain: jest.fn() },
          methodName: 'loadUserAgain',
        });
      }).toThrow('Duplicate node loader for type UserNode');
    });

    it('should allow registration of different types with different GraphQL names', () => {
      (
        TypeMetadataStorage.getObjectTypeMetadataByTarget as jest.Mock
      ).mockImplementation(target => {
        if (target === UserNode) {
          return { name: 'User' };
        }
        if (target === PostNode) {
          return { name: 'Post' };
        }
        return undefined;
      });

      registry = new NodeLoaderRegistry();

      const userLoader = {
        type: UserNode,
        instance: mockInstance,
        methodName: 'loadUser',
      };

      const postLoader = {
        type: PostNode,
        instance: { loadPost: jest.fn() },
        methodName: 'loadPost',
      };

      expect(() => {
        registry.register(userLoader);
        registry.register(postLoader);
      }).not.toThrow();

      expect(registry.getLoader('User')).toEqual(userLoader);
      expect(registry.getLoader('Post')).toEqual(postLoader);
    });
  });
});

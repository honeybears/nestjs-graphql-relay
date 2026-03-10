import {
  ConnectionFetcherArgs,
  DefaultConnectionService,
} from './default-connection.service';
import { NodeInterface } from 'src/interfaces/node.interface';
import { DefaultGlobalIdStrategy } from './global-id.strategy';
import { ObjectType } from '@nestjs/graphql';

@ObjectType('UserNode', { implements: () => [NodeInterface] })
class UserNode extends NodeInterface {
  name: string;
  email: string;
  index: number;
}

const globalIdStrategy = new DefaultGlobalIdStrategy();

describe('DefaultConnectionService', () => {
  let service: DefaultConnectionService<UserNode>;

  describe('execute', () => {
    class ExecuteTestService extends DefaultConnectionService<UserNode> {
      protected override fetchNodes(
        args: ConnectionFetcherArgs,
      ): Promise<(UserNode | null | undefined)[]> {
        const { limit, isForward } = args;
        const nodes: UserNode[] = [];

        if (isForward) {
          for (let i = 0; i < limit; i++) {
            nodes.push({
              id: globalIdStrategy.serialize('UserNode', i),
              name: `User ${i}`,
              email: `user${i}@example.com`,
              index: i,
            });
          }
        } else {
          for (let i = limit - 1; i >= 0; i--) {
            nodes.push({
              id: globalIdStrategy.serialize('UserNode', i),
              name: `User ${i}`,
              email: `user${i}@example.com`,
              index: i,
            });
          }
        }
        return Promise.resolve(nodes);
      }
    }

    beforeEach(() => {
      service = new ExecuteTestService();
    });

    it('should return the correct connection', async () => {
      const result = await service.execute({ first: 10 });
      expect(result).toEqual({
        edges: expect.any(Array),
        pageInfo: expect.any(Object),
      });

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: expect.any(String),
        endCursor: expect.any(String),
      });
      expect(result.edges?.[0]?.node?.index).toBe(0);
      expect(result.edges?.[9]?.node?.index).toBe(9);
    });

    it('should return the correct connection in reverse order', async () => {
      const result = await service.execute({ last: 10 });
      expect(result).toEqual({
        edges: expect.any(Array),
        pageInfo: expect.any(Object),
      });

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: expect.any(String),
        endCursor: expect.any(String),
      });
      expect(result.edges?.[0]?.node?.index).toBe(9);
      expect(result.edges?.[9]?.node?.index).toBe(0);
    });
  });

  describe('encodeCursor', () => {
    class EncodeCursorTestService extends DefaultConnectionService<UserNode> {
      nodes: UserNode[] = [];

      constructor(
        nodes: UserNode[],
        encodeCursor?: (node: UserNode | null | undefined) => string,
      ) {
        super();
        this.nodes = nodes;
        if (encodeCursor) {
          this.encodeCursor = encodeCursor;
        }
      }

      protected override fetchNodes(
        args: ConnectionFetcherArgs,
      ): Promise<(UserNode | null | undefined)[]> {
        return Promise.resolve(this.nodes);
      }

      protected override encodeCursor(
        node: UserNode | null | undefined,
      ): string {
        return Buffer.from(`${node?.id}`).toString('base64');
      }
    }

    it('should encode the cursor correctly', async () => {
      const node = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        index: 0,
      };
      service = new EncodeCursorTestService([node]);

      const result = await service.execute({ first: 1 });
      expect(result.edges?.[0]?.cursor).toBe(
        Buffer.from(`${node.id}`).toString('base64'),
      );
    });

    it('should encode the cursor correctly with custom encodeCursor', async () => {
      const node = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        index: 0,
      };
      service = new EncodeCursorTestService(
        [node],
        (node: UserNode | null | undefined) => {
          return Buffer.from(`${node?.name}`).toString('base64');
        },
      );

      const result = await service.execute({ first: 1 });
      expect(result.edges?.[0]?.cursor).toBe(
        Buffer.from(`${node.name}`).toString('base64'),
      );
    });

    it('should throw error when node is null', () => {
      class EncodeCursorErrorTestService extends DefaultConnectionService<UserNode> {
        protected override fetchNodes(): Promise<
          (UserNode | null | undefined)[]
        > {
          return Promise.resolve([]);
        }
      }
      const errorTestService = new EncodeCursorErrorTestService();
      expect(() => errorTestService['encodeCursor'](null)).toThrow(
        'Node is null or undefined',
      );
    });

    it('should throw error when node is undefined', () => {
      class EncodeCursorErrorTestService extends DefaultConnectionService<UserNode> {
        protected override fetchNodes(): Promise<
          (UserNode | null | undefined)[]
        > {
          return Promise.resolve([]);
        }
      }
      const errorTestService = new EncodeCursorErrorTestService();
      expect(() => errorTestService['encodeCursor'](undefined)).toThrow(
        'Node is null or undefined',
      );
    });
  });

  describe('decodeCursor', () => {
    class DecodeCursorTestService extends DefaultConnectionService<UserNode> {
      protected override fetchNodes(): Promise<(UserNode | null | undefined)[]> {
        return Promise.resolve([]);
      }
    }

    beforeEach(() => {
      service = new DecodeCursorTestService();
    });

    it('should decode cursor correctly', () => {
      const originalValue = 'test-cursor-value';
      const encodedCursor = Buffer.from(originalValue).toString('base64');
      const decoded = service['decodeCursor'](encodedCursor);
      expect(decoded).toBe(originalValue);
    });
  });

  describe('pagination with cursors', () => {
    class PaginationTestService extends DefaultConnectionService<UserNode> {
      private allUsers: UserNode[] = [];

      constructor() {
        super();
        // Create 20 test users
        for (let i = 0; i < 20; i++) {
          this.allUsers.push({
            id: globalIdStrategy.serialize('UserNode', i),
            name: `User ${i}`,
            email: `user${i}@example.com`,
            index: i,
          });
        }
      }

      protected override fetchNodes(
        args: ConnectionFetcherArgs,
      ): Promise<(UserNode | null | undefined)[]> {
        const { limit, cursor, isForward } = args;
        let startIndex = 0;

        if (cursor) {
          const decodedId = cursor as string;
          const cursorIndex = this.allUsers.findIndex(
            user => user.id === decodedId,
          );
          startIndex = isForward ? cursorIndex + 1 : cursorIndex - limit + 1;
        }

        if (isForward) {
          return Promise.resolve(
            this.allUsers.slice(startIndex, startIndex + limit),
          );
        } else {
          const endIndex = cursor
            ? this.allUsers.findIndex(user => user.id === cursor)
            : this.allUsers.length;
          return Promise.resolve(
            this.allUsers.slice(Math.max(0, endIndex - limit), endIndex),
          );
        }
      }

      protected override encodeCursor(
        node: UserNode | null | undefined,
      ): string {
        if (!node) throw new Error('Node is null or undefined');
        return Buffer.from(`${node.id}`).toString('base64');
      }

      protected override decodeCursor(cursor: string): unknown {
        return Buffer.from(cursor, 'base64').toString('utf-8');
      }
    }

    beforeEach(() => {
      service = new PaginationTestService();
    });

    it('should paginate forward with "after" cursor', async () => {
      const firstPage = await service.execute({ first: 5 });
      expect(firstPage.edges).toHaveLength(5);
      expect(firstPage.edges?.[0]?.node?.index).toBe(0);
      expect(firstPage.edges?.[4]?.node?.index).toBe(4);
      expect(firstPage.pageInfo.hasNextPage).toBe(true);
      expect(firstPage.pageInfo.hasPreviousPage).toBe(false);

      const secondPage = await service.execute({
        first: 5,
        after: firstPage.pageInfo.endCursor!,
      });
      expect(secondPage.edges).toHaveLength(5);
      expect(secondPage.edges?.[0]?.node?.index).toBe(5);
      expect(secondPage.edges?.[4]?.node?.index).toBe(9);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it('should paginate backward with "before" cursor', async () => {
      const lastPage = await service.execute({ last: 5 });
      expect(lastPage.edges).toHaveLength(5);
      expect(lastPage.edges?.[0]?.node?.index).toBe(15);
      expect(lastPage.edges?.[4]?.node?.index).toBe(19);
      expect(lastPage.pageInfo.hasNextPage).toBe(false);
      expect(lastPage.pageInfo.hasPreviousPage).toBe(true);

      const previousPage = await service.execute({
        last: 5,
        before: lastPage.pageInfo.startCursor!,
      });
      expect(previousPage.edges).toHaveLength(5);
      expect(previousPage.edges?.[0]?.node?.index).toBe(10);
      expect(previousPage.edges?.[4]?.node?.index).toBe(14);
      expect(previousPage.pageInfo.hasNextPage).toBe(true);
      expect(previousPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it('should use defaultLimit when no first or last is provided', async () => {
      const result = await service.execute({});
      expect(result.edges).toHaveLength(10);
      expect(result.edges?.[0]?.node?.index).toBe(0);
      expect(result.edges?.[9]?.node?.index).toBe(9);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });
  });

  describe('error handling', () => {
    class ErrorHandlingTestService extends DefaultConnectionService<UserNode> {
      protected override fetchNodes(): Promise<(UserNode | null | undefined)[]> {
        return Promise.resolve([]);
      }
    }

    beforeEach(() => {
      service = new ErrorHandlingTestService();
    });

    it('should throw error when "first" is negative', async () => {
      await expect(service.execute({ first: -1 })).rejects.toThrow(
        'Argument "first" must be a non-negative integer',
      );
    });

    it('should throw error when "last" is negative', async () => {
      await expect(service.execute({ last: -5 })).rejects.toThrow(
        'Argument "last" must be a non-negative integer',
      );
    });

    it('should throw error when both "first" and "last" are provided', async () => {
      await expect(service.execute({ first: 10, last: 10 })).rejects.toThrow(
        'Passing both "first" and "last" is not supported',
      );
    });

    it('should throw error when both "after" and "before" are provided', async () => {
      const cursor = Buffer.from('test').toString('base64');
      await expect(
        service.execute({ first: 10, after: cursor, before: cursor }),
      ).rejects.toThrow('Passing both "after" and "before" is not supported');
    });
  });

  describe('edge cases', () => {
    it('should handle empty nodes array', async () => {
      class EmptyConnectionService extends DefaultConnectionService<UserNode> {
        protected override fetchNodes(): Promise<
          (UserNode | null | undefined)[]
        > {
          return Promise.resolve([]);
        }
      }

      const emptyService = new EmptyConnectionService();
      const result = await emptyService.execute({ first: 10 });

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it('should handle when nodes are less than requested', async () => {
      class SmallConnectionService extends DefaultConnectionService<UserNode> {
        protected override fetchNodes(): Promise<
          (UserNode | null | undefined)[]
        > {
          return Promise.resolve([
            {
              id: globalIdStrategy.serialize('UserNode', 0),
              name: 'User 0',
              email: 'user0@example.com',
              index: 0,
            },
            {
              id: globalIdStrategy.serialize('UserNode', 1),
              name: 'User 1',
              email: 'user1@example.com',
              index: 1,
            },
          ]);
        }
      }

      const smallService = new SmallConnectionService();
      const result = await smallService.execute({ first: 10 });

      expect(result.edges).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it('should handle last page correctly', async () => {
      class FinalPageConnectionService extends DefaultConnectionService<UserNode> {
        protected override fetchNodes(): Promise<
          (UserNode | null | undefined)[]
        > {
          // Simulate last page by returning less than limit
          // execute() requests limit + 1, so returning exactly 5 nodes
          // when limit is 11 (10 + 1) means this is the last page
          const nodes: UserNode[] = [];
          for (let i = 0; i < 5; i++) {
            nodes.push({
              id: globalIdStrategy.serialize('UserNode', i + 10),
              name: `User ${i + 10}`,
              email: `user${i + 10}@example.com`,
              index: i + 10,
            });
          }
          return Promise.resolve(nodes);
        }
      }

      const finalPageService = new FinalPageConnectionService();
      const result = await finalPageService.execute({ first: 10 });

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});

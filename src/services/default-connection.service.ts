import { DefaultConnectionArgs } from 'src/generators/connection.generator';
import { NodeInterface } from 'src/interfaces/node.interface';
import { IConnection } from 'src/generators/connection.generator';

export interface IConnectionService<TNode extends NodeInterface> {
  execute(args: DefaultConnectionArgs): Promise<IConnection<TNode>>;
}

export interface ConnectionFetcherArgs {
  limit: number;
  cursor?: unknown;
  isForward: boolean;
}

export abstract class DefaultConnectionService<
  TNode extends NodeInterface,
> implements IConnectionService<TNode> {
  protected defaultLimit = 10;

  protected abstract fetchNodes(
    args: ConnectionFetcherArgs,
  ): Promise<(TNode | null | undefined)[]>;

  protected encodeCursor(node: TNode | null | undefined): string {
    if (!node) throw new Error('Node is null or undefined');
    return Buffer.from(`${node.id}`).toString('base64');
  }

  protected decodeCursor(cursor: string): unknown {
    try {
      return Buffer.from(cursor, 'base64').toString('utf-8');
    } catch {
      throw new Error('Invalid cursor format');
    }
  }

  public async execute(
    args: DefaultConnectionArgs,
  ): Promise<IConnection<TNode>> {
    const { first, last, after, before } = args;

    if (first !== undefined && first < 0) {
      throw new Error('Argument "first" must be a non-negative integer');
    }
    if (last !== undefined && last < 0) {
      throw new Error('Argument "last" must be a non-negative integer');
    }
    if (first !== undefined && last !== undefined) {
      throw new Error('Passing both "first" and "last" is not supported');
    }
    if (after !== undefined && before !== undefined) {
      throw new Error('Passing both "after" and "before" is not supported');
    }

    const requestedCount = first || last || this.defaultLimit;

    const cursor = after ?? before;

    const nodes = await this.fetchNodes({
      limit: requestedCount + 1,
      cursor: cursor ? this.decodeCursor(cursor) : undefined,
      isForward: !last,
    });

    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first !== undefined) {
      if (nodes.length > first) {
        hasNextPage = true;
        nodes.splice(first);
      }
      if (after) hasPreviousPage = true;
    } else if (last !== undefined) {
      if (nodes.length > last) {
        hasPreviousPage = true;
        nodes.splice(0, nodes.length - last);
      }
      if (before) hasNextPage = true;
    } else {
      if (nodes.length > this.defaultLimit) {
        hasNextPage = true;
        nodes.splice(this.defaultLimit);
      }
    }

    const edges = nodes.map(node => ({
      node: node ?? null,
      cursor: this.encodeCursor(node),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    };
  }
}

import { GraphQLError } from 'graphql';

export interface GlobalId {
  typename: string;
  id: string;
}

export interface GlobalIdStrategy {
  parse(gid: string): GlobalId;
  serialize(typename: string, id: unknown): string;
}

export class DefaultGlobalIdStrategy implements GlobalIdStrategy {
  parse(gid: string): GlobalId {
    const decoded = Buffer.from(gid, 'base64').toString('utf-8');

    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) {
      throw new InvalidGlobalIdException(`Invalid global ID format: ${gid}`);
    }

    const typename = decoded.slice(0, colonIndex);
    const id = decoded.slice(colonIndex + 1);

    if (!typename || !id) {
      throw new InvalidGlobalIdException(`Invalid global ID: ${gid}`);
    }

    return { typename, id };
  }

  serialize(typename: string, id: unknown): string {
    return Buffer.from(`${typename}:${id}`).toString('base64');
  }
}

export class InvalidGlobalIdException extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'INVALID_GLOBAL_ID' },
    });
  }
}

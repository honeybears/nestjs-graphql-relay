# nestjs-graphql-relay

A library for implementing the [Relay specification](https://relay.dev/graphql/connections.htm) in NestJS with the GraphQL code-first approach.

- **Node interface** & automatic Global ID handling
- **`node(id)` query** auto-registration
- **Connection / Edge / PageInfo** type factories
- **`@NodeLoader`** decorator with automatic discovery

---

## Installation

```bash
npm install nestjs-graphql-relay
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/graphql graphql reflect-metadata
```

---

## Getting Started

### 1. Register the Module

Register `GraphQLRelayModule.forRoot()` in your root module.
All ObjectType classes that implement the Node interface must be listed in the `types` option.

```ts
// app.module.ts
import { GraphQLRelayModule } from 'nestjs-graphql-relay';
import { User } from './user/user.entity';
import { Post } from './post/post.entity';

@Module({
  imports: [
    GraphQLModule.forRoot({ ... }),
    GraphQLRelayModule.forRoot({
      types: [User, Post],
    }),
  ],
})
export class AppModule {}
```

---

## Node Interface

### Extending NodeInterface

Extend `NodeInterface` to implement the Relay `Node` interface.
The `id` field is automatically serialized as a **Global ID**.

```ts
// user.entity.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { NodeInterface } from 'nestjs-graphql-relay';

@ObjectType({ implements: () => [NodeInterface] })
export class User extends NodeInterface {
  @Field()
  name: string;

  @Field()
  email: string;
}
```

### @NodeLoader Decorator

Registers the method that handles `node(id: ID!)` queries for a given type.
The decorated method receives a **raw database id (string)** and must return an instance of the corresponding type.

```ts
// user.resolver.ts
import { Resolver } from '@nestjs/graphql';
import { NodeLoader } from 'nestjs-graphql-relay';
import { User } from './user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @NodeLoader(() => User)
  async loadUser(id: string): Promise<User | null> {
    return this.userService.findById(id);
  }
}
```

### node Query Example

```graphql
query {
  node(id: "VXNlcjox") {
    id
    ... on User {
      name
      email
    }
  }
}
```

---

## Global ID

### Default Strategy (DefaultGlobalIdStrategy)

Encodes and decodes `typename:id` as **Base64**.

| DB id | typename | Global ID (Base64)  |
|-------|----------|---------------------|
| `1`   | `User`   | `VXNlcjox`          |
| `42`  | `Post`   | `UG9zdDo0Mg==`      |

### Custom Strategy

Implement the `GlobalIdStrategy` interface to replace the default behavior.

```ts
import { GlobalIdStrategy, GlobalId } from 'nestjs-graphql-relay';

export class UuidGlobalIdStrategy implements GlobalIdStrategy {
  parse(gid: string): GlobalId {
    const [typename, id] = gid.split(':');
    return { typename, id };
  }

  serialize(typename: string, id: unknown): string {
    return `${typename}:${id}`;
  }
}
```

```ts
// app.module.ts
GraphQLRelayModule.forRoot({
  types: [User, Post],
  globalIdStrategy: new UuidGlobalIdStrategy(),
}),
```

---

## Connection Types

Use the factory functions to generate Relay Connection spec types.

### Edge / Connection Factories

```ts
// user-connection.type.ts
import { ObjectType } from '@nestjs/graphql';
import { Edge, Connection } from 'nestjs-graphql-relay';
import { User } from './user.entity';

@ObjectType()
export class UserEdge extends Edge(User) {}

@ObjectType()
export class UserConnection extends Connection(User) {}
```

Generated GraphQL schema:

```graphql
type UserEdge {
  cursor: String!
  node: User
}

type UserConnection {
  edges: [UserEdge]
  pageInfo: PageInfo
  totalCount: Int
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### ConnectionArgs

An `ArgsType` that contains pagination arguments: `first`, `after`, `last`, `before`.

```ts
import { ConnectionArgs } from 'nestjs-graphql-relay';
```

### ConnectionService

An abstract class for implementing connection query logic.

```ts
// user-connection.service.ts
import { Injectable } from '@nestjs/common';
import { ConnectionService, ConnectionArgs, ConnectionType } from 'nestjs-graphql-relay';
import { User } from './user.entity';

@Injectable()
export class UserConnectionService extends ConnectionService {
  async execute<T>(args: ConnectionArgs): Promise<ConnectionType<T>> {
    const { first = 10, after } = args;

    const [items, total] = await this.userRepository.findAndCount({ ... });

    return {
      edges: items.map((item, i) => ({
        cursor: Buffer.from(String(i)).toString('base64'),
        node: item as T,
      })),
      pageInfo: {
        hasNextPage: items.length === first,
        hasPreviousPage: !!after,
        startCursor: ...,
        endCursor: ...,
      },
      totalCount: total,
    } as ConnectionType<T>;
  }
}
```

### Connection Resolver Example

```ts
// user-connection.resolver.ts
import { Resolver, Query, Args } from '@nestjs/graphql';
import { ConnectionArgs } from 'nestjs-graphql-relay';
import { UserConnection } from './user-connection.type';
import { UserConnectionService } from './user-connection.service';

@Resolver(() => UserConnection)
export class UserConnectionResolver {
  constructor(private readonly service: UserConnectionService) {}

  @Query(() => UserConnection)
  async users(@Args() args: ConnectionArgs): Promise<UserConnection> {
    return this.service.execute(args);
  }
}
```

```graphql
query {
  users(first: 10, after: "cursor==") {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        name
      }
    }
  }
}
```

---

## @EdgeLoader Decorator

Works similarly to `@NodeLoader` — marks a method as an edge loader so it is automatically discovered and registered in the EdgeLoader registry.

```ts
import { EdgeLoader } from 'nestjs-graphql-relay';
import { UserEdge } from './user-connection.type';

@Resolver(() => UserConnection)
export class UserConnectionResolver {
  @EdgeLoader(() => UserEdge)
  async loadEdges(args: ConnectionArgs) {
    return this.service.execute(args);
  }
}
```

---

## API Reference

### Module

| API | Description |
|-----|-------------|
| `GraphQLRelayModule.forRoot(options)` | Initialize the module |
| `options.types` | Array of ObjectType classes that implement the Node interface (required) |
| `options.globalIdStrategy` | Custom Global ID strategy (optional, defaults to Base64) |

### Interfaces & Types

| API | Description |
|-----|-------------|
| `NodeInterface` | Abstract class for the Relay Node interface (includes `id: ID!`) |
| `ConnectionArgs` | ArgsType with `first`, `after`, `last`, `before` fields |
| `ConnectionType<T>` | Interface with `edges`, `pageInfo`, `totalCount` |
| `EdgeType<T>` | Interface with `cursor` and `node` |
| `PageInfo` | Object with `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor` |

### Factories

| API | Description |
|-----|-------------|
| `Edge(classRef)` | Generates an Edge ObjectType |
| `Connection(classRef)` | Generates a Connection ObjectType |

### Decorators

| API | Description |
|-----|-------------|
| `@NodeLoader(() => Type)` | Registers a method as the `node(id)` query handler for a type |
| `@EdgeLoader(() => Type)` | Registers a method as an edge loader for a type |

### Abstract Services

| API | Description |
|-----|-------------|
| `ConnectionService` | Abstract class for connection queries — implement `execute(args)` |

### Strategies

| API | Description |
|-----|-------------|
| `GlobalIdStrategy` | Interface for a custom Global ID strategy |
| `DefaultGlobalIdStrategy` | Built-in Base64 strategy using `typename:id` format |

---

## License

MIT

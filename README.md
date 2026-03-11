# nestjs-graphql-relay

A library for implementing the [Relay specification](https://relay.dev/graphql/connections.htm) in NestJS with the GraphQL code-first approach.

- **Node interface** & automatic Global ID handling
- **`node(id)` query** auto-registration
- **`@NodeLoader`** decorator with automatic discovery

**GitHub**: [https://github.com/honeybears/nestjs-graphql-relay](https://github.com/honeybears/nestjs-graphql-relay)

---

## Installation

```bash
npm install @honeybears/nestjs-graphql-relay
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/graphql graphql reflect-metadata
```

---

## Getting Started

### 1. Register the Module

Register `GraphQLRelayModule.forRoot()` in your root module.

```ts
// app.module.ts
import { GraphQLRelayModule } from '@honeybears/nestjs-graphql-relay';

@Module({
  imports: [
    GraphQLModule.forRoot({ ... }),
    GraphQLRelayModule.forRoot({}),
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
import { NodeInterface } from '@honeybears/nestjs-graphql-relay';

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

Place `@NodeLoader` on a method of any NestJS injectable (typically a service).
The module uses `DiscoveryService` to automatically find all registered loaders at startup.

```ts
// user.service.ts
import { Injectable } from '@nestjs/common';
import { NodeLoader } from '@honeybears/nestjs-graphql-relay';
import { User } from './user.entity';

@Injectable()
export class UserService {
  @NodeLoader(() => User)
  async findById(id: string): Promise<User | null> {
    // return user by raw database id
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

### Automatic Serialization

When you extend `NodeInterface`, the `id` field is **automatically serialized** to a Global ID through field middleware. You don't need to manually convert database IDs – just store and return raw IDs in your entities.

### Default Strategy (DefaultGlobalIdStrategy)

Encodes and decodes `typename:id` as **Base64**.

| DB id | typename | Global ID (Base64)  |
|-------|----------|---------------------|
| `1`   | `User`   | `VXNlcjox`          |
| `42`  | `Post`   | `UG9zdDo0Mg==`      |

### Custom Strategy

Implement the `GlobalIdStrategy` interface to replace the default behavior.

```ts
import { GlobalIdStrategy, GlobalId } from '@honeybears/nestjs-graphql-relay';

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
  globalIdStrategy: new UuidGlobalIdStrategy(),
}),
```


---

## API Reference

### Module

| API | Description |
|-----|-------------|
| `GraphQLRelayModule.forRoot(options?)` | Initialize the module |
| `options.globalIdStrategy` | Custom Global ID strategy (optional, defaults to Base64) |

### Interfaces & Types

| API | Description |
|-----|-------------|
| `NodeInterface` | Abstract class for the Relay Node interface (includes `id: ID!`) |

### Decorators

| API | Description |
|-----|-------------|
| `@NodeLoader(() => Type)` | Registers a method as the `node(id)` query handler for a type |

### Strategies

| API | Description |
|-----|-------------|
| `GlobalIdStrategy` | Interface for a custom Global ID strategy |
| `DefaultGlobalIdStrategy` | Built-in Base64 strategy using `typename:id` format |

---

## Testing

Run the unit tests:

```bash
npm test
```

Run the e2e tests:

```bash
npm run test:e2e
```

### E2E Test Structure

Each e2e spec defines its own `AppModule` inline with only the providers it needs, so specs are fully isolated from one another.

```
e2e/
├── fixtures/                          # Shared entities, services, and resolvers
│   ├── user.entity.ts / .service.ts / .resolver.ts
│   ├── post.entity.ts / .service.ts / .resolver.ts
│   ├── comment.entity.ts / .service.ts / .resolver.ts
│   ├── alert.entity.ts
│   ├── timestamped.interface.ts
│   ├── search-result.union.ts
│   ├── notification.union.ts
│   └── union.resolver.ts
└── specs/
    ├── node-interface.e2e-spec.ts     # node(id) query resolution
    ├── global-id.e2e-spec.ts          # Global ID encode/decode
    ├── integration.e2e-spec.ts        # Regular queries and nested relationships
    ├── error-handling.e2e-spec.ts     # Invalid IDs and missing types
    ├── multiple-interfaces.e2e-spec.ts  # ObjectType implementing multiple interfaces
    ├── union-types.e2e-spec.ts        # Union type resolution
    └── schema.e2e-spec.ts             # GraphQL schema introspection
```

---

## License

MIT

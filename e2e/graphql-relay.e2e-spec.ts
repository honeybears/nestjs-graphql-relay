import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './common-e2e.module';
import { DefaultGlobalIdStrategy } from '../src/services/global-id.strategy';

describe('GraphQL Relay Module (e2e)', () => {
  let app: INestApplication;
  const globalIdStrategy = new DefaultGlobalIdStrategy();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Node Interface Query', () => {
    it('should query a User node by global ID', async () => {
      const globalId = globalIdStrategy.serialize('User', '1');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${globalId}") {
                id
                __typename
                ... on User {
                  name
                  email
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.node).toEqual({
        id: globalId,
        __typename: 'User',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should query a Post node by global ID', async () => {
      const globalId = globalIdStrategy.serialize('PostNode', '1');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${globalId}") {
                id
                __typename
                ... on PostNode {
                  title
                  content
                  author {
                    id
                    name
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.node).toMatchObject({
        id: globalId,
        __typename: 'PostNode',
        title: 'First Post',
        content: 'This is the first post content',
      });
      expect(response.body.data.node.author.name).toBe('John Doe');
    });

    it('should return null for non-existent node', async () => {
      const globalId = globalIdStrategy.serialize('User', '999');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${globalId}") {
                id
                __typename
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.node).toBeNull();
    });

    it('should handle invalid global ID format', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "invalid-id") {
                id
                __typename
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('INVALID_GLOBAL_ID');
    });

    it('should query multiple nodes sequentially', async () => {
      const userGlobalId = globalIdStrategy.serialize('User', '1');
      const postGlobalId = globalIdStrategy.serialize('PostNode', '2');

      const userResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${userGlobalId}") {
                id
                __typename
                ... on User {
                  name
                }
              }
            }
          `,
        })
        .expect(200);

      const postResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${postGlobalId}") {
                id
                __typename
                ... on PostNode {
                  title
                }
              }
            }
          `,
        })
        .expect(200);

      expect(userResponse.body.data.node.__typename).toBe('User');
      expect(userResponse.body.data.node.name).toBe('John Doe');
      expect(postResponse.body.data.node.__typename).toBe('PostNode');
      expect(postResponse.body.data.node.title).toBe('Second Post');
    });
  });

  describe('Global ID Strategy', () => {
    it('should correctly encode and decode global IDs', () => {
      const typename = 'User';
      const id = '123';

      const encoded = globalIdStrategy.serialize(typename, id);
      const decoded = globalIdStrategy.parse(encoded);

      expect(decoded).toEqual({ typename, id });
    });

    it('should handle IDs with special characters', () => {
      const typename = 'User';
      const id = 'abc-123-xyz';

      const encoded = globalIdStrategy.serialize(typename, id);
      const decoded = globalIdStrategy.parse(encoded);

      expect(decoded).toEqual({ typename, id });
    });
  });

  describe('Integration with regular queries', () => {
    it('should query all users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              users {
                id
                name
                email
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.users).toHaveLength(3);
      expect(response.body.data.users[0].name).toBe('John Doe');
    });

    it('should query all posts', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              posts {
                id
                title
                content
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.posts).toHaveLength(3);
      expect(response.body.data.posts[0].title).toBe('First Post');
    });

    it('should resolve nested relationships', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              users {
                id
                name
                posts {
                  id
                  title
                  author {
                    name
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      if (response.body.errors) {
        console.log(
          'GraphQL Errors:',
          JSON.stringify(response.body.errors, null, 2),
        );
      }
      console.log('Response:', JSON.stringify(response.body));

      const johnDoe = response.body.data.users.find(
        (u: any) => u.name === 'John Doe',
      );
      expect(johnDoe.posts).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should return error for non-existent type', async () => {
      const globalId = globalIdStrategy.serialize('NonExistent', '1');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "${globalId}") {
                id
                __typename
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Node loader not found',
      );
    });

    it('should handle malformed base64 ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              node(id: "not-base64!!!") {
                id
                __typename
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GraphQL Schema', () => {
    it('should include Node interface in schema', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              __type(name: "Node") {
                name
                kind
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.__type.name).toBe('Node');
      expect(response.body.data.__type.kind).toBe('INTERFACE');
      expect(
        response.body.data.__type.fields.find((f: any) => f.name === 'id'),
      ).toBeDefined();
    });

    it('should verify User implements Node interface', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              __type(name: "User") {
                name
                interfaces {
                  name
                }
              }
            }
          `,
        })
        .expect(200);

      const nodeInterface = response.body.data.__type.interfaces.find(
        (i: any) => i.name === 'Node',
      );
      expect(nodeInterface).toBeDefined();
    });

    it('should verify Post implements Node interface', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              __type(name: "PostNode") {
                name
                interfaces {
                  name
                }
              }
            }
          `,
        })
        .expect(200);

      const nodeInterface = response.body.data.__type.interfaces.find(
        (i: any) => i.name === 'Node',
      );
      expect(nodeInterface).toBeDefined();
    });
  });
});

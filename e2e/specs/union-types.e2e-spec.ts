import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLRelayModule } from '../../src/graphql-relay.module';
import { UserService } from '../fixtures/user.service';
import { UserResolver } from '../fixtures/user.resolver';
import { PostService } from '../fixtures/post.service';
import { PostResolver } from '../fixtures/post.resolver';
import { CommentService } from '../fixtures/comment.service';
import { CommentResolver } from '../fixtures/comment.resolver';
import { UnionResolver } from '../fixtures/union.resolver';
import { DefaultGlobalIdStrategy } from '../../src/services/global-id.strategy';

@Module({
  imports: [
    GraphQLRelayModule.forRoot({}),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
  ],
  providers: [
    UserService,
    UserResolver,
    PostService,
    PostResolver,
    CommentService,
    CommentResolver,
    UnionResolver,
  ],
})
class AppModule {}

describe('Union Types (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SearchResult union (all members implement Node)', () => {
    it('should return mixed types with correct __typename', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              search(term: "John") {
                __typename
                ... on User {
                  name
                  email
                }
                ... on PostNode {
                  title
                }
                ... on Comment {
                  body
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const results = response.body.data.search;
      expect(results.length).toBeGreaterThan(0);

      const user = results.find((r: any) => r.__typename === 'User');
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should discriminate PostNode members via inline fragment', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              search(term: "post") {
                __typename
                ... on PostNode {
                  title
                  content
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const posts = response.body.data.search.filter(
        (r: any) => r.__typename === 'PostNode',
      );
      expect(posts.length).toBeGreaterThan(0);
      posts.forEach((p: any) => {
        expect(p.title).toBeDefined();
        expect(p.content).toBeDefined();
      });
    });

    it('should discriminate Comment members via inline fragment', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              search(term: "great") {
                __typename
                ... on Comment {
                  body
                  createdAt
                  updatedAt
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const comments = response.body.data.search.filter(
        (r: any) => r.__typename === 'Comment',
      );
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].body).toBe('Great post!');
      expect(comments[0].createdAt).toBeDefined();
    });

    it('node(id) should resolve correctly for types accessed through a union', async () => {
      const userGlobalId = new DefaultGlobalIdStrategy().serialize('User', '1');

      const [nodeResponse, searchResponse] = await Promise.all([
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query {
                node(id: "${userGlobalId}") {
                  id
                  __typename
                  ... on User { name }
                }
              }
            `,
          }),
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query {
                search(term: "John") {
                  __typename
                  ... on User { name }
                }
              }
            `,
          }),
      ]);

      const nodeUser = nodeResponse.body.data.node;
      const searchUser = searchResponse.body.data.search.find(
        (r: any) => r.__typename === 'User',
      );

      expect(nodeUser.name).toBe(searchUser.name);
      expect(nodeUser.__typename).toBe(searchUser.__typename);
    });

    it('should verify SearchResult is a UNION type in schema', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              __type(name: "SearchResult") {
                name
                kind
                possibleTypes {
                  name
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const type = response.body.data.__type;
      expect(type.name).toBe('SearchResult');
      expect(type.kind).toBe('UNION');

      const typeNames = type.possibleTypes.map((t: any) => t.name);
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('PostNode');
      expect(typeNames).toContain('Comment');
    });
  });

  describe('Notification union (mixed Node and non-Node members)', () => {
    it('should return Comment and Alert members with correct __typename', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              notifications {
                __typename
                ... on Comment {
                  body
                  createdAt
                }
                ... on Alert {
                  message
                  severity
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const items = response.body.data.notifications;

      const comments = items.filter((i: any) => i.__typename === 'Comment');
      const alerts = items.filter((i: any) => i.__typename === 'Alert');

      expect(comments.length).toBeGreaterThan(0);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('Alert (non-Node) members should resolve with their own fields only', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              notifications {
                __typename
                ... on Alert {
                  message
                  severity
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const alerts = response.body.data.notifications.filter(
        (i: any) => i.__typename === 'Alert',
      );

      expect(alerts[0].message).toBe('System maintenance scheduled');
      expect(alerts[0].severity).toBe('info');
      expect(alerts[1].message).toBe('Disk usage above 90%');
      expect(alerts[1].severity).toBe('warning');
    });

    it('Comment (Node) members in a union should still be resolvable via node(id)', async () => {
      const commentGlobalId = new DefaultGlobalIdStrategy().serialize(
        'Comment',
        '1',
      );

      const [notifResponse, nodeResponse] = await Promise.all([
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query {
                notifications {
                  __typename
                  ... on Comment { body }
                }
              }
            `,
          }),
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query {
                node(id: "${commentGlobalId}") {
                  __typename
                  ... on Comment { body }
                }
              }
            `,
          }),
      ]);

      expect(notifResponse.body.errors).toBeUndefined();
      expect(nodeResponse.body.errors).toBeUndefined();

      const commentInUnion = notifResponse.body.data.notifications.find(
        (i: any) => i.__typename === 'Comment',
      );
      const commentViaNode = nodeResponse.body.data.node;

      expect(commentInUnion.body).toBe(commentViaNode.body);
    });

    it('should verify Notification is a UNION type with correct possible types', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              __type(name: "Notification") {
                name
                kind
                possibleTypes {
                  name
                  interfaces {
                    name
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const type = response.body.data.__type;
      expect(type.name).toBe('Notification');
      expect(type.kind).toBe('UNION');

      const typeNames = type.possibleTypes.map((t: any) => t.name);
      expect(typeNames).toContain('Comment');
      expect(typeNames).toContain('Alert');

      const commentType = type.possibleTypes.find(
        (t: any) => t.name === 'Comment',
      );
      const alertType = type.possibleTypes.find((t: any) => t.name === 'Alert');

      const commentInterfaces = commentType.interfaces.map((i: any) => i.name);
      expect(commentInterfaces).toContain('Node');
      expect(alertType.interfaces).toHaveLength(0);
    });

    it('should return only __typename for non-matching inline fragment members', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              notifications {
                __typename
                ... on Comment { body }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const alerts = response.body.data.notifications.filter(
        (i: any) => i.__typename === 'Alert',
      );
      alerts.forEach((a: any) => {
        expect(Object.keys(a)).toEqual(['__typename']);
      });
    });
  });
});

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLRelayModule } from '../../src/graphql-relay.module';
import { UserService } from '../fixtures/user.service';
import { CommentService } from '../fixtures/comment.service';
import { CommentResolver } from '../fixtures/comment.resolver';
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
  providers: [UserService, CommentService, CommentResolver],
})
class AppModule {}

describe('Multiple Interface Inheritance (e2e)', () => {
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

  it('should query a Comment node by global ID (implements Node + Timestamped)', async () => {
    const globalId = new DefaultGlobalIdStrategy().serialize('Comment', '1');

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            node(id: "${globalId}") {
              id
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
    expect(response.body.data.node).toEqual({
      id: globalId,
      __typename: 'Comment',
      body: 'Great post!',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('should resolve Comment as Node interface', async () => {
    const globalId = new DefaultGlobalIdStrategy().serialize('Comment', '2');

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

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.node.__typename).toBe('Comment');
    expect(response.body.data.node.id).toBe(globalId);
  });

  it('should resolve nested author on Comment via node query', async () => {
    const globalId = new DefaultGlobalIdStrategy().serialize('Comment', '1');

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            node(id: "${globalId}") {
              id
              ... on Comment {
                body
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

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.node.body).toBe('Great post!');
    expect(response.body.data.node.author.name).toBe('John Doe');
  });

  it('should verify Comment implements both Node and Timestamped interfaces', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            __type(name: "Comment") {
              name
              interfaces {
                name
              }
            }
          }
        `,
      })
      .expect(200);

    const interfaces: { name: string }[] = response.body.data.__type.interfaces;
    expect(interfaces.find(i => i.name === 'Node')).toBeDefined();
    expect(interfaces.find(i => i.name === 'Timestamped')).toBeDefined();
  });

  it('should expose all interface fields on Comment type', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            __type(name: "Comment") {
              fields {
                name
              }
            }
          }
        `,
      })
      .expect(200);

    const fieldNames: string[] = response.body.data.__type.fields.map(
      (f: { name: string }) => f.name,
    );
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('createdAt');
    expect(fieldNames).toContain('updatedAt');
    expect(fieldNames).toContain('body');
  });

  it('should query all comments with Timestamped fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            comments {
              id
              body
              createdAt
              updatedAt
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.comments).toHaveLength(3);
    expect(response.body.data.comments[0]).toMatchObject({
      body: 'Great post!',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('should return null for non-existent Comment node', async () => {
    const globalId = new DefaultGlobalIdStrategy().serialize('Comment', '999');

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

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.node).toBeNull();
  });
});

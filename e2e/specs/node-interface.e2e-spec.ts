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
  providers: [UserService, UserResolver, PostService, PostResolver],
})
class AppModule {}

describe('Node Interface Query (e2e)', () => {
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

  it('should query a User node by global ID', async () => {
    const globalId = new DefaultGlobalIdStrategy().serialize('User', '1');

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
    const globalId = new DefaultGlobalIdStrategy().serialize('PostNode', '1');

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
    const globalId = new DefaultGlobalIdStrategy().serialize('User', '999');

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
    const userGlobalId = new DefaultGlobalIdStrategy().serialize('User', '1');
    const postGlobalId = new DefaultGlobalIdStrategy().serialize(
      'PostNode',
      '2',
    );

    const userResponse = await request(app.getHttpServer())
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
              ... on PostNode { title }
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

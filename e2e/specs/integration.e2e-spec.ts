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
import { GlobalIdStrategyRegistry } from 'src/services/global-id.registry';

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

describe('Integration with Regular Queries (e2e)', () => {
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

    const johnDoe = response.body.data.users.find(
      (u: any) => u.name === 'John Doe',
    );
    expect(johnDoe.posts).toHaveLength(3);
  });

  it('should query a post by global ID', async () => {
    const globalId = GlobalIdStrategyRegistry.get().serialize('PostNode', '1');
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            post(id: "${globalId}") {
              id
              title
              content
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.data.post.title).toBe('First Post');
    expect(response.body.data.post.id).toBe(globalId);
  });

  it('should query a user by global ID', async () => {
    const globalId = GlobalIdStrategyRegistry.get().serialize('User', '1');
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            user(id: "${globalId}") {
              id
              name
              email
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.data.user.name).toBe('John Doe');
    expect(response.body.data.user.id).toBe(globalId);
  });
});

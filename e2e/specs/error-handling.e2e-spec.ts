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
import { globalIdStrategy } from './setup';

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

describe('Error Handling (e2e)', () => {
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
    expect(response.body.errors[0].message).toContain('Node loader not found');
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

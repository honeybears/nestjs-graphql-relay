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

describe('GraphQL Schema (e2e)', () => {
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

  it('should verify PostNode implements Node interface', async () => {
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

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLRelayModule } from '../src/graphql-relay.module';
import { UserService } from './fixtures/user.service';
import { PostService } from './fixtures/post.service';
import { UserResolver } from './fixtures/user.resolver';
import { PostResolver } from './fixtures/post.resolver';

@Module({
  imports: [
    GraphQLRelayModule.forRoot({}),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
  ],
  providers: [UserService, PostService, UserResolver, PostResolver],
})
export class AppModule {}

'use client';

// Apollo Client 4 — from() is now ApolloLink.from()
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
} from '@apollo/client';
import { createAuthLink, createErrorLink }
  from './apollo-links';
import { GQL_ENDPOINT }
  from '@/lib/constants';

let instance: ApolloClient<object> | null = null;

function createApolloClient(): ApolloClient<object> {
  return new ApolloClient({
    // ApolloLink.from() is the v4 replacement for from()
    link: ApolloLink.from([
      createErrorLink(), // 1. catch UNAUTHENTICATED
      createAuthLink(),  // 2. attach Bearer token
      new HttpLink({ uri: GQL_ENDPOINT }), // 3. HTTP
    ]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: { errorPolicy: 'all' },
    },
  });
}

export function getApolloClient(): ApolloClient<object> {
  if (!instance) instance = createApolloClient();
  return instance;
}

// MUST call on logout to prevent data leak
export function resetApolloClient(): void {
  instance?.clearStore();
  instance = null;
}

// src/lib/graphql/server-gql-fetcher.ts
'use server';

import { GraphQLClient, ClientError } from 'graphql-request';
import { GQL_ENDPOINT } from '@/lib/constants';
import { getAccessToken } from '@/modules/auth/lib/cookies';
import { refreshAccessToken } from '@/modules/auth/lib/refresh';
import { RateLimitError } from './gql-errors'; // only this new import

function buildClient(token: string): GraphQLClient {
  return new GraphQLClient(GQL_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function isAuthError(error: unknown): boolean {
  if (error instanceof ClientError) {
    return error.response.status === 401;
  }
  return false;
}

// ✅ ONLY new function — narrow and safe
function isRateLimitError(error: unknown): boolean {
  if (error instanceof ClientError) {
    // BE returns 429 HTTP status
    return error.response.status === 429;
  }
  if (error instanceof SyntaxError) {
    // BE returns plain text "Too many requests" 
    // which fails JSON parse — very specific check
    const msg = error.message.toLowerCase();
    return msg.includes('too many') || msg.includes('rate limit');
  }
  return false;
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 400;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function serverGqlFetch
  TData,
  TVars extends Record<string, unknown> = Record<string, unknown>
>(
  query: string,
  variables?: TVars,
  retryCount = 0,
): Promise<TData> {
  let token: string | undefined = await getAccessToken();
  let alreadyRefreshed = false;

  if (!token) {
    token = (await refreshAccessToken()) ?? undefined;
    alreadyRefreshed = true;
    if (!token) throw new Error('SESSION_EXPIRED');
  }

  try {
    // ✅ Your original working request — unchanged
    const result = await buildClient(token).request<TData>(
      query,
      variables,
    );
    return result;

  } catch (error) {

    // ── Rate limit: retry with backoff ──────────────────
    // Check this BEFORE auth check — order matters
    if (isRateLimitError(error)) {
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
        console.warn(
          `[serverGqlFetch] Rate limited. ` +
          `Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`
        );
        await wait(delay);
        return serverGqlFetch<TData, TVars>(query, variables, retryCount + 1);
      }
      // All retries exhausted — throw typed RateLimitError
      // Actions catch this and return [] gracefully
      throw new RateLimitError();
    }

    // ── Auth error: try token refresh once ──────────────
    // ✅ YOUR ORIGINAL LOGIC — completely unchanged
    if (isAuthError(error)) {
      if (alreadyRefreshed) throw new Error('SESSION_EXPIRED');
      const newToken = (await refreshAccessToken()) ?? undefined;
      if (!newToken) throw new Error('SESSION_EXPIRED');
      return buildClient(newToken).request<TData>(query, variables);
    }

    // ── Everything else: re-throw as-is ─────────────────
    // ✅ CRITICAL — don't wrap in GqlFetchError
    // Let original ClientError bubble up to actions
    // This is what was breaking — I was wrapping this before
    throw error;
  }
}

===================

  // src/lib/graphql/gql-errors.ts
// Only RateLimitError needed — remove the rest

export class RateLimitError extends Error {
  readonly statusCode = 429;
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function isRateLimitError(e: unknown): e is RateLimitError {
  return e instanceof RateLimitError;
}

============
  // src/modules/locations/actions/server-location-functions.ts
// REVERT catch block to near-original — only add rate limit check

} catch (error) {
  // Only handle rate limit — let everything else be original
  if (error instanceof RateLimitError) {
    console.warn('[getLocationFunctions] Rate limited — returning []');
    return [];
  }
  // ✅ Original behavior — log and return fallback
  console.error('[getLocationFunctions]', error);
  return [];
}

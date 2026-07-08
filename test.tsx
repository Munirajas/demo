// src/app/api/revalidate-functions/route.ts
// Server-side only — never imported by client
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { locationId } = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId required' },
        { status: 400 },
      );
    }

    // Safe — this is server-only route handler
    revalidateTag(`location-functions-${locationId}`);

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 },
    );
  }
}
======================================

  // src/modules/locations/lib/revalidate-functions-client.ts
// Pure client utility — no server imports at all
// Calls the API route instead

export async function revalidateLocationFunctions(
  locationId: string,
): Promise<void> {
  try {
    await fetch('/api/revalidate-functions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    });
  } catch (error) {
    // Non-critical — log but don't throw
    // Client cache invalidation already handles immediate UI update
    console.warn(
      '[revalidateLocationFunctions] Failed to bust server cache:',
      error,
    );
  }
}

==========================

  // src/modules/locations/hooks/useToggleFunction.ts
'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  UpdateLocationFunctionInput,
  UpdateLocationFunctionResponse,
} from '@/types/locations';
import { useAuthMutation } from '@/modules/auth/hooks/useAuthMutation';
import { UPDATE_LOCATION_FUNCTION_MUTATION } from
  '../graphql/locations.mutations';
import { functionKeys } from '../lib/constants';
import { toast } from 'sonner';

// ✅ Import from lib/ not actions/ — no server imports
import { revalidateLocationFunctions } from
  '../lib/revalidate-functions-client';

export function useToggleFunction(locationId: number) {
  const queryClient = useQueryClient();

  return useAuthMutation
    UpdateLocationFunctionResponse,
    UpdateLocationFunctionInput
  >(
    UPDATE_LOCATION_FUNCTION_MUTATION,
    {
      onSuccess: async (data) => {
        const result = data.upsertLocationFunction;

        if (!result.success) {
          toast.error(
            result.message || 'Failed to update the function.',
          );
          return;
        }

        // ① Invalidate client TanStack Query cache immediately
        queryClient.invalidateQueries({
          queryKey: functionKeys.byLocation(locationId),
        });

        // ② Bust Next.js server cache via API route
        //    fire-and-forget — UI already updated by ①
        revalidateLocationFunctions(String(locationId));

        toast.success('Updated successfully.');
      },

      onError: (error) => {
        toast.error(error.message || 'Something went wrong.');
      },
    },
  );
}

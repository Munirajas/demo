// src/modules/locations/actions/client-location-functions.ts
// Client-side fetcher — called by TanStack Query queryFn
// Uses your existing graphql client pattern

import { clientGqlFetch } from '@/lib/graphql/client-gql-fetcher';
import { LocationFunction, RawLocationFunction } from '@/types/locations';
import { mapFunctionsWithSlug, sortConfigFirst } from '../lib/utils';
import { GET_LOCATION_FUNCTIONS } from '../graphql/locations.queries';

interface GetLocationConfigResponse {
  getLocationFunctions: {
    success: boolean;
    message: string;
    data: RawLocationFunction[];
  };
}

export async function fetchLocationFunctions(
  locationId: string,
): Promise<LocationFunction[]> {
  try {
    const response = await clientGqlFetch<GetLocationConfigResponse>(
      GET_LOCATION_FUNCTIONS,
      { type: 'client', locationId: Number(locationId) },
    );

    if (!response.getLocationFunctions?.success) return [];

    return sortConfigFirst(
      mapFunctionsWithSlug(response.getLocationFunctions.data),
    );
  } catch {
    return [];
  }
}

===============

  await revalidateLocationFunctions(String(locationId));

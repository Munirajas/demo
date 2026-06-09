// UPDATE your imports to match your actual paths
import { buildTreeFromFlat, getFirstLocation } 
  from '@/modules/locations/lib/utils';
import type { 
  LocationNode, 
  GetLocationDescendentsResponse 
} from '@/types/locations';

// Also update the function signature to take clientId from URL
// instead of env var:

export const getLocationsTree = cache(
  async (clientId: number): Promise<LocationNode[]> => {
    try {
      const response = await serverGqlFetch<GetLocationDescendentsResponse>(
        GET_LOCATION_DESCENDENTS,
        { type: 'client', locationId: clientId }
      );
      if (!response.getLocationDescendents.success) return [];
      return buildTreeFromFlat(response.getLocationDescendents.data);
    } catch (error) {
      console.error('[getLocationsTree]', error);
      return [];
    }
  }
);

export async function resolveFirstLocation(
  clientId: number
): Promise<string | null> {
  const tree = await getLocationsTree(clientId);
  return getFirstLocation(tree)?.id ?? null;
}

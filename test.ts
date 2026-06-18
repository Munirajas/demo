// lib/utils.ts

import { FUNCTION_MAPPING_BY_ID } from './constants';

// 1. Filter only enabled functions
export function filterEnabledFunctions(data: LocationFunction[]) {
  return data.filter((fn) => fn.Is_Enabled === 1);
}

// 2. Map raw data to enriched with slug + label
export function mapFunctionsWithConfig(data: LocationFunction[]) {
  return data.map((item) => {
    const config = FUNCTION_MAPPING_BY_ID[item.Function_Type_Id];
    return {
      ...item,
      label: config?.label ?? item.Function_Type_name,
      slug:  config?.slug  ?? item.Function_Type_name
               .toLowerCase()
               .replace(/\s+/g, '-'),
    };
  });
}

// 3. Combined — filter enabled + enrich with slug/label
export function mapRawFunctionsToLocationFunctions(
  data: LocationFunction[]
) {
  return filterEnabledFunctions(data)
    .map((item) => {
      const config = FUNCTION_MAPPING_BY_ID[item.Function_Type_Id];
      return {
        ...item,
        label: config?.label ?? item.Function_Type_name,
        slug:  config?.slug  ?? item.Function_Type_name
                 .toLowerCase()
                 .replace(/\s+/g, '-'),
      };
    });
}

// 4. Find single function by id
export function getFunctionById(
  data: LocationFunction[],
  id: number
) {
  return data.find((fn) => fn.Function_Type_Id === id) ?? null;
}

// 5. Get slug for a given function type id
export function getSlugById(id: number): string {
  return FUNCTION_MAPPING_BY_ID[id]?.slug ?? '';
}

// 6. Get function by slug (for routing)
export function getFunctionBySlug(
  data: LocationFunction[],
  slug: string
) {
  return mapFunctionsWithConfig(data).find(
    (fn) => fn.slug === slug
  ) ?? null;
}





// server-location-functions.ts
const functionsData = response.getLocationFunctions.data ?? [];

return mapRawFunctionsToLocationFunctions(functionsData);
// Already filtered (Is_Enabled=1) + enriched (slug, label)

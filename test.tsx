// src/app/(protected)/location/[slug]/[fn]/page.tsx
// URL: /location/motb/plan-selection

import { notFound } from 'next/navigation';
import { getLocationsTree } from '@/modules/locations/actions/server-locations';
import { getNodeAndPathBySlug } from '@/modules/locations/lib/utils';
import { renderFunctionPage } from './render-function-page';

interface Props {
  params: Promise<{ slug: string; fn: string }>;
}

export default async function LocationFunctionPage({ params }: Props) {
  const { slug, fn } = await params;

  console.log('FN page - slug:', slug, 'fn:', fn); // keep temporarily

  // ⚠️ Tree is cached — no second network call (React.cache)
  const tree = await getLocationsTree();
  const found = getNodeAndPathBySlug(tree, slug);

  console.log('FN page - found:', JSON.stringify(found)); // check this

  if (!found) notFound();

  const locationId: number = found.node.id;

  return renderFunctionPage({ fn, locationId });
}


// src/app/(protected)/location/[slug]/[fn]/render-function-page.tsx
// ONLY file to edit when adding new function pages

import { notFound } from 'next/navigation';
import { getLocationPlans } from '@/modules/plans/actions/server-location-plans';
import { PlanShell } from '@/modules/plans/components/PlanShell';

interface Props {
  fn: string;
  locationId: number;
}

export async function renderFunctionPage({ fn, locationId }: Props) {
  switch (fn) {
    case 'plan-selection': {
      const result = await getLocationPlans(locationId);
      return (
        <PlanShell
          plans={result.plans}
          locationId={locationId}
          message={result.message}
        />
      );
    }

    // Add next function here when ready:
    // case 'tickets': {
    //   const result = await getLocationTickets(locationId);
    //   return <TicketsShell ... />;
    // }

    default:
      notFound();
  }
}

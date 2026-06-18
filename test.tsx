// src/components/layout/LocationShell.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getLocationsTree } from '@/modules/locations/actions/server-locations';
import { getLocationFunctions } from '@/modules/locations/actions/server-location-functions';
import { getNodeAndPathBySlug, locationUrl } from '@/modules/locations/lib/utils';
import { FunctionsNav } from '../nav/FunctionsNav';
import { Breadcrumbs } from './Breadcrumbs';
import { NoFunctionsAvailable } from '../nav/NoFunctionsAvailable';
import { FunctionsNavSkeleton } from '../nav/FunctionsNavSkeleton';
import { ContentSkeleton } from './ContentSkeleton';

// ─────────────────────────────────────────────────────────
// KEY FIX: FunctionsNavLoader fetches its OWN data
// Do NOT pass functions as prop — fetch inside so Suspense fires
// ─────────────────────────────────────────────────────────
async function FunctionsNavLoader({
  locationId,
  locationSlug,
  activeFn,
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
}) {
  // Fetch happens HERE — inside Suspense child
  const functions = await getLocationFunctions(locationId);

  if (functions.length === 0) {
    return <NoFunctionsAvailable locationLabel={locationSlug} />;
  }

  return (
    <FunctionsNav
      locationSlug={locationSlug}
      activeFn={activeFn}
      functions={functions}
    />
  );
}

// ─────────────────────────────────────────────────────────
// FullWidthLoader — shown as SINGLE panel while loading
// Replaces both Col2 and Col3 — matches your Image 2 goal
// ─────────────────────────────────────────────────────────
function FullWidthLoader() {
  return (
    <div className="flex flex-1 items-center justify-center
      animate-pulse">
      <div className="text-center space-y-3">
        <div className="mx-auto h-8 w-8 rounded-full
          bg-gray-200" />
        <div className="h-3 w-40 rounded bg-gray-200 mx-auto" />
        <div className="h-2.5 w-56 rounded bg-gray-100 mx-auto" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FunctionsSection — decides Col2+Col3 vs single panel
// Fetches functions ITSELF so Suspense boundary works
// ─────────────────────────────────────────────────────────
async function FunctionsSection({
  locationId,
  locationSlug,
  activeFn,
  children,
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
  children: React.ReactNode;
}) {
  const functions = await getLocationFunctions(locationId);

  // No functions — show single full-width panel (Image 2 goal)
  if (functions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <NoFunctionsAvailable locationLabel={locationSlug} />
      </div>
    );
  }

  // Has functions — show Col2 + Col3 split
  return (
    <>
      {/* Col 2 — Function Nav */}
      <aside className="w-48 flex-shrink-0 border-r
        border-gray-200 bg-white overflow-y-auto">
        <FunctionsNav
          locationSlug={locationSlug}
          activeFn={activeFn}
          functions={functions}
        />
      </aside>

      {/* Col 3 — Page content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Suspense fallback={<ContentSkeleton />}>
          {children}
        </Suspense>
      </main>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// LocationShell — clean, minimal, Suspense at right level
// ─────────────────────────────────────────────────────────
export async function LocationShell({
  slug,
  activeFn,
  children,
}: {
  slug: string;
  activeFn: string | null;
  children: React.ReactNode;
}) {
  // Only fetch tree here — fast, cached
  const tree = await getLocationsTree();
  const found = getNodeAndPathBySlug(tree, slug);
  if (!found) notFound();

  const { node, path } = found;
  const breadcrumbs = buildBreadcrumbs(node, path, activeFn);

  return (
    <div className="flex flex-col h-full">

      {/* Breadcrumbs — resolves instantly from tree */}
      <div className="px-6 py-1 border-b border-gray-100
        bg-white shrink-0">
        <Breadcrumbs
          key={`${slug}-${activeFn ?? 'none'}`}
          items={breadcrumbs}
        />
      </div>

      {/* Col 2 + Col 3 area */}
      <div className="flex flex-1 overflow-hidden">
        {/*
          Suspense here wraps FunctionsSection entirely.
          While getLocationFunctions is pending:
            → Shows FullWidthLoader (single panel — your Image 2 goal)
          When resolved:
            → If no functions: single NoFunctionsAvailable panel
            → If has functions: Col2 nav + Col3 content split
        */}
        <Suspense fallback={<FullWidthLoader />}>
          <FunctionsSection
            locationId={node.id}
            locationSlug={slug}
            activeFn={activeFn}
          >
            {children}
          </FunctionsSection>
        </Suspense>
      </div>
    </div>
  );
}

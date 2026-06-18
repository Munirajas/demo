// src/components/layout/LocationShell.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getLocationsTree } from
  '@/modules/locations/actions/server-locations';
import { getLocationFunctions } from
  '@/modules/locations/actions/server-location-functions';
import { FunctionsNav } from '../nav/FunctionsNav';
import { Breadcrumbs } from './Breadcrumbs';
import {
  buildBreadcrumbs,
  getNodeAndPathBySlug,
} from '@/modules/locations/lib/utils';
import type { BreadcrumbItem } from '@/types/locations';
import { FunctionsNavSkeleton } from
  '../nav/FunctionsNavSkeleton';
import { ContentSkeleton } from './ContentSkeleton';
import { BreadcrumbSkeleton } from './BreadcrumbSkeleton';
import { NoFunctionsAvailable } from
  '../nav/NoFunctionsAvailable';

interface Props {
  slug: string;
  activeFn: string | null;
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────
// FunctionsNavLoader — fetches Col2 data independently
//
// KEY: keyed by SLUG only (not activeFn)
// This means it only re-fetches when LOCATION changes
// NOT when function changes — Col2 stays stable on fn click
// ─────────────────────────────────────────────────────
async function FunctionsNavLoader({
  locationId,
  locationSlug,
  activeFn,
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
}) {
  const functions = await getLocationFunctions(locationId);

  if (functions.length === 0) {
    return (
      <NoFunctionsAvailable locationLabel={locationSlug} />
    );
  }

  return (
    <FunctionsNav
      locationSlug={locationSlug}
      activeFn={activeFn}
      functions={functions}
    />
  );
}

// ─────────────────────────────────────────────────────
// LocationShell — two separate Suspense boundaries
//
// Suspense 1 (Col2): key={slug}
//   → only fires when LOCATION changes ✅
//   → stable when function changes ✅
//
// Suspense 2 (Col3): key={`${slug}-${activeFn}`}
//   → fires when EITHER location OR function changes ✅
//   → this is what you want for content loading ✅
// ─────────────────────────────────────────────────────
export async function LocationShell({
  slug,
  activeFn,
  children,
}: Props) {
  const tree = await getLocationsTree();
  const found = getNodeAndPathBySlug(tree, slug);
  if (!found) notFound();

  const { node, path } = found;
  const breadcrumbs = buildBreadcrumbs(node, path, activeFn);

  return (
    <div className="flex flex-col h-full">

      {/* Breadcrumb row */}
      <div className="px-6 py-1 border-b border-gray-100
        bg-white shrink-0">
        <Suspense
          key={`breadcrumb-${slug}-${activeFn ?? 'none'}`}
          fallback={<BreadcrumbSkeleton />}
        >
          <Breadcrumbs
            key={`${slug}-${activeFn ?? 'none'}`}
            items={breadcrumbs}
          />
        </Suspense>
      </div>

      {/* Column area */}
      <div className="flex flex-1 overflow-hidden">

        {/*
          Col 2 — Suspense key={slug} ONLY
          ✅ Skeletons when location changes
          ✅ Does NOT skeleton when function changes
          
          Why: React reuses this Suspense boundary when
          only activeFn changes (key stays same).
          Re-mounts only when slug changes (new location).
        */}
        <Suspense
          key={`col2-${slug}`}
          fallback={
            <aside className="w-48 flex-shrink-0 border-r
              border-gray-200 bg-white">
              <FunctionsNavSkeleton />
            </aside>
          }
        >
          {/*
            FunctionsNavLoader renders its own aside.
            If no functions → single panel, no Col3.
            If has functions → aside only (Col3 separate).
          */}
          <FunctionsNavWithLayout
            locationId={node.id}
            locationSlug={slug}
            activeFn={activeFn}
            hasContent={activeFn !== null}
          >
            {/*
              Col 3 — Suspense key={slug + activeFn}
              ✅ Skeletons when function OR location changes
              ✅ Independent from Col2 Suspense
            */}
            <Suspense
              key={`col3-${slug}-${activeFn ?? 'none'}`}
              fallback={<ContentSkeleton />}
            >
              {children}
            </Suspense>
          </FunctionsNavWithLayout>
        </Suspense>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FunctionsNavWithLayout
//
// Fetches functions then decides layout:
//   0 functions → single full-width panel (no Col3)
//   has functions → Col2 aside + Col3 children
//
// This runs inside col2 Suspense so:
//   - Only re-fetches on location change (key={slug})
//   - Col2 nav stays mounted on fn click ✅
// ─────────────────────────────────────────────────────
async function FunctionsNavWithLayout({
  locationId,
  locationSlug,
  activeFn,
  hasContent,
  children,
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
  hasContent: boolean;
  children: React.ReactNode;
}) {
  const functions = await getLocationFunctions(locationId);

  // No functions → single full-width, no Col3
  if (functions.length === 0) {
    return (
      <div className="flex flex-1 items-center
        justify-center bg-gray-50">
        <NoFunctionsAvailable locationLabel={locationSlug} />
      </div>
    );
  }

  // Has functions → Col2 + Col3
  return (
    <>
      {/* Col 2 — stable, never re-mounts on fn change */}
      <aside className="w-48 flex-shrink-0 border-r
        border-gray-200 bg-white overflow-y-auto">
        <FunctionsNav
          locationSlug={locationSlug}
          activeFn={activeFn}
          functions={functions}
        />
      </aside>

      {/* Col 3 — children already wrapped in Suspense above */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </>
  );
}

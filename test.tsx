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
// ColumnsLoader
//
// Fetches functions and decides 1 vs 2 column layout.
//
// KEY CHANGE: no longer receives {children} directly.
// Receives {col3Content} which is already wrapped in its
// OWN Suspense outside — so Col3 skeleton is independent
// from this component's Suspense boundary.
//
// This means:
//   - ColumnsLoader Suspense key={`col2-${slug}`}
//     → only fires on LOCATION change
//     → stable on fn click ✅
//
//   - Col3 Suspense key={`col3-${slug}-${activeFn}`}
//     → fires on fn change AND location change ✅
// ─────────────────────────────────────────────────────
async function ColumnsLoader({
  locationId,
  locationSlug,
  activeFn,
  col3Content,  // ← renamed from children, already Suspense-wrapped
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
  col3Content: React.ReactNode;
}) {
  const functions = await getLocationFunctions(locationId);

  // No functions → single full-width panel, no Col3
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
      {/* Col 2 — stable, never re-fetches on fn click */}
      <aside className="w-48 flex-shrink-0 border-r
        border-gray-200 bg-white overflow-y-auto">
        <FunctionsNav
          locationSlug={locationSlug}
          activeFn={activeFn}
          functions={functions}
        />
      </aside>

      {/* Col 3 — pre-wrapped Suspense passed from parent */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {col3Content}
      </main>
    </>
  );
}

// ─────────────────────────────────────────────────────
// ColumnsLoadingSkeleton — shown while ColumnsLoader
// fetches functions (location change only)
// ─────────────────────────────────────────────────────
function ColumnsLoadingSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse">
      {/* Col 2 skeleton */}
      <aside className="w-48 flex-shrink-0 border-r
        border-gray-200 bg-white px-3 py-2 space-y-1">
        {[70, 90, 55, 80, 65].map((w, i) => (
          <div
            key={i}
            className="flex items-center px-2 py-2.5"
          >
            <div
              className="h-3.5 rounded bg-gray-200"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </aside>

      {/* Col 3 skeleton */}
      <div className="flex-1 bg-gray-50 p-6 space-y-4">
        <div className="h-5 w-44 rounded bg-gray-200" />
        <div className="h-14 w-full rounded-lg
          border border-gray-200 bg-gray-100" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i}
              className="h-24 rounded-lg border-2
                border-gray-200 bg-white p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LocationShell
//
// TWO separate Suspense boundaries with different keys:
//
// Suspense 1 — key={`col2-${slug}`}
//   Wraps ColumnsLoader (Col2 nav + layout decision)
//   key changes only on LOCATION change
//   → Col2 skeleton only on location click ✅
//   → Col2 stable on fn click ✅
//
// Suspense 2 — key={`col3-${slug}-${activeFn ?? 'none'}`}
//   Wraps children (Col3 page content)
//   key changes on LOCATION or FUNCTION change
//   → Col3 skeleton on both location and fn click ✅
//   → Passed as col3Content prop into ColumnsLoader
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

  // Col3 Suspense — built here, passed into ColumnsLoader
  // Key includes activeFn so it re-mounts on fn click
  const col3Content = (
    <Suspense
      key={`col3-${slug}-${activeFn ?? 'none'}`}
      fallback={<ContentSkeleton />}
    >
      {children}
    </Suspense>
  );

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
          key={`col2-${slug}`} — ONLY changes on location change.
          Function clicks keep same key → Suspense NOT remounted
          → ColumnsLoader NOT refetched → Col2 nav stays stable ✅
        */}
        <Suspense
          key={`col2-${slug}`}
          fallback={<ColumnsLoadingSkeleton />}
        >
          <ColumnsLoader
            locationId={node.id}
            locationSlug={slug}
            activeFn={activeFn}
            col3Content={col3Content}
          />
        </Suspense>

      </div>
    </div>
  );
}

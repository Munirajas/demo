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
// ColumnsLoader — THE KEY FIX
//
// Controls BOTH Col2 and Col3 together after fetching.
// This is the only way to conditionally show 1 vs 2 columns
// based on async data — Suspense wraps the whole decision.
//
// While loading → Suspense shows ColumnsLoadingSkeleton
// After load:
//   0 functions → single full-width NoFunctionsAvailable
//   has functions → Col2 nav + Col3 content
// ─────────────────────────────────────────────────────
async function ColumnsLoader({
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

  // ✅ Single column — no functions
  if (functions.length === 0) {
    return (
      <div className="flex flex-1 items-center
        justify-center bg-gray-50">
        <NoFunctionsAvailable locationLabel={locationSlug} />
      </div>
    );
  }

  // ✅ Two columns — functions exist
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

// ─────────────────────────────────────────────────────
// Skeleton shown while ColumnsLoader is fetching
// Single full-width panel — matches your expectation
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
// LocationShell — clean, delegates column decision
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

      {/* Breadcrumb row — resolves instantly from tree */}
      <div className="px-6 py-1 border-b border-gray-100
        bg-white shrink-0">
        <Suspense fallback={<BreadcrumbSkeleton />}>
          <Breadcrumbs
            key={`${slug}-${activeFn ?? 'none'}`}
            items={breadcrumbs}
          />
        </Suspense>
      </div>

      {/* Column area — Suspense wraps entire 1 vs 2 col decision */}
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<ColumnsLoadingSkeleton />}>
          <ColumnsLoader
            locationId={node.id}
            locationSlug={slug}
            activeFn={activeFn}
          >
            {children}
          </ColumnsLoader>
        </Suspense>
      </div>

    </div>
  );
}

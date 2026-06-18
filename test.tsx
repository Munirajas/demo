// src/components/layout/LocationShell.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getLocationsTree } from '@/modules/locations/actions/server-locations';
import { getLocationFunctions } from '@/modules/locations/actions/server-location-functions';
import { FunctionsNav } from '../nav/FunctionsNav';
import { FUNCTION_LABELS } from '@/modules/locations/lib/constants';
import { Breadcrumbs } from './Breadcrumbs';
import { NoFunctionsAvailable } from '../nav/NoFunctionsAvailable';
import { getNodeAndPathBySlug, locationUrl } from '@/modules/locations/lib/utils';
import { FunctionsNavSkeleton } from '../nav/FunctionsNavSkeleton';
import { ContentSkeleton } from './ContentSkeleton';

interface Props {
  children: React.ReactNode;
}

// ✅ FIXED: fetches its OWN data — Suspense fires correctly
async function FunctionsNavLoader({
  locationId,        // ← changed: receives id not data
  locationSlug,      // ← was missing from your call
  activeFn,
}: {
  locationId: number;
  locationSlug: string;
  activeFn: string | null;
}) {
  // Fetch INSIDE — this is what makes Suspense work
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

export async function LocationShell({
  slug,
  activeFn,
  children,
}: {
  slug: string;
  activeFn: string | null;
  children: React.ReactNode;
}) {
  const tree = await getLocationsTree();
  const found = getNodeAndPathBySlug(tree, slug);
  if (!found) notFound();

  const { node, path } = found;

  // ✅ REMOVED: const functions = await getLocationFunctions(node.id)
  // Moving this into FunctionsNavLoader so Suspense can intercept it

  const breadcrumbs = buildBreadcrumbs(node, path, activeFn);

  return (
    <Shell
      slug={slug}
      activeFn={activeFn}
      breadcrumbs={breadcrumbs}
    >
      <Shell.Nav>
        {/*
          ✅ Suspense NOW fires because FunctionsNavLoader
          does its own await inside — not receiving resolved data
        */}
        <Suspense fallback={<FunctionsNavSkeleton />}>
          <FunctionsNavLoader
            locationId={node.id}       // ← id not data
            locationSlug={slug}        // ← was missing
            activeFn={activeFn}
          />
        </Suspense>
      </Shell.Nav>

      <Shell.Content>
        <Suspense fallback={<ContentSkeleton />}>
          {children}
        </Suspense>
      </Shell.Content>
    </Shell>
  );
}

// Shell + Shell.Nav + Shell.Content — your existing code below
function Shell({
  slug,
  activeFn,
  breadcrumbs,
  children,
}: {
  slug: string;
  activeFn: string | null;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-1 border-b border-gray-100
        bg-white shrink-0">
        <Breadcrumbs
          key={`${slug}-${activeFn ?? 'none'}`}
          items={breadcrumbs}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ShellNav({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-48 border-r border-gray-200
      bg-white overflow-y-auto shrink-0">
      {children}
    </aside>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      {children}
    </main>
  );
}

Shell.Nav = ShellNav;
Shell.Content = ShellContent;

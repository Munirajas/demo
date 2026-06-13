// ─────────────────────────────────────────────────────────────
// FIX: Breadcrumbs not updating between /config ↔ /memberships
//
// Breadcrumbs is 'use client' and holds `open` (ellipsis dropdown)
// state via useState. Add a `key` so React fully remounts it on
// every slug/activeFn change — guarantees fresh render + resets
// any stuck dropdown state from the previous route.
//
// ONLY CHANGE in LocationShell.tsx — the Shell() helper function:
// ─────────────────────────────────────────────────────────────

import type { BreadcrumbItem } from '@/types/locations';
import { Breadcrumbs } from '@/components/nav/Breadcrumbs';

// BEFORE:
// function Shell({ breadcrumbs, children }: {...}) {
//   return (
//     <div className="flex flex-col h-full">
//       <div className="px-6 py-3 border-b border-gray-100 bg-white shrink-0">
//         <Breadcrumbs items={breadcrumbs} />
//       </div>
//       {children}
//     </div>
//   );
// }

// AFTER — pass slug + activeFn down so Shell can build the key:
function Shell({
  slug, activeFn, breadcrumbs, children,
}: {
  slug:        string;
  activeFn:    string | null;
  breadcrumbs: BreadcrumbItem[];
  children:    React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        {/* key forces remount → fresh Breadcrumbs render every
            time slug or activeFn changes (config → memberships, etc.) */}
        <Breadcrumbs
          key={`${slug}:${activeFn ?? 'none'}`}
          items={breadcrumbs}
        />
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// And update BOTH call sites of <Shell ...> in LocationShell
// to pass the new props:
//
//   // empty-functions branch:
//   <Shell slug={slug} activeFn={null} breadcrumbs={breadcrumbs}>
//     <NoFunctionsAvailable locationLabel={node.label} />
//   </Shell>
//
//   // normal branch:
//   <Shell slug={slug} activeFn={activeFn} breadcrumbs={breadcrumbs}>
//     <div className="flex flex-1 overflow-hidden"> ... </div>
//   </Shell>
// ─────────────────────────────────────────────────────────────

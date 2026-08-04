// LocationShell.tsx — no other changes needed
<Breadcrumbs items={breadcrumbs} locationSlug={slug} fn={activeFn} />

// Breadcrumbs.tsx
interface Props {
  items: BreadcrumbItem[];
  locationSlug: string;
  fn: string | null;
}

export function Breadcrumbs({ items, locationSlug, fn }: Props) {
  const pathname = usePathname();

  const allItems = useMemo(
    () => appendNestedCrumbs(items, locationSlug, fn, pathname),
    [items, locationSlug, fn, pathname],
  );
  // ...render logic unchanged
}

function appendNestedCrumbs(
  baseItems: BreadcrumbItem[],
  locationSlug: string,
  fn: string | null,
  pathname: string,
): BreadcrumbItem[] {
  if (!baseItems.length || !fn) return baseItems;

  // Deterministic — no dependency on which layout a hook happens to be scoped to.
  const fnHref = `/location/${locationSlug}/${fn}`;
  const fnParts = fnHref.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  const matchesFnPath = fnParts.every((p, i) => pathParts[i] === p);
  const nestedSegments = matchesFnPath ? pathParts.slice(fnParts.length) : [];

  const items = [...baseItems];
  items[items.length - 1] = {
    ...items[items.length - 1],
    label: ROUTE_SEGMENT_LABELS[fn] ?? items[items.length - 1].label,
    href: fnHref,
  };

  if (!nestedSegments.length) return items;

  const extra: BreadcrumbItem[] = [];
  let hrefSoFar = fnHref;
  for (const seg of nestedSegments) {
    hrefSoFar = `${hrefSoFar}/${seg}`;
    const label = ROUTE_SEGMENT_LABELS[seg];
    if (label) {
      extra.push({ label, href: hrefSoFar });
    } else if (extra.length) {
      const prev = extra[extra.length - 1];
      extra[extra.length - 1] = { ...prev, label: `${prev.label} / ${seg}`, href: hrefSoFar };
    }
  }
  return [...items, ...extra];
}

// ADD to your modules/locations/lib/utils.ts

import type { RawLocationItem } from '@/types/locations';

export interface LocationNode {
  id:       string;
  label:    string;
  type:     'client' | 'location';
  parentId: string | null;
  children: LocationNode[];
}

export function buildTreeFromFlat(items: RawLocationItem[]): LocationNode[] {
  const map = new Map<string, LocationNode>();

  for (const item of items) {
    map.set(String(item.Location_Id), {
      id:       String(item.Location_Id),
      label:    item.Location_Name,
      type:     item.Level === 0 ? 'client' : 'location',
      parentId: item.Parent_Location_Id != null
        ? String(item.Parent_Location_Id)
        : null,
      children: [],
    });
  }

  const roots: LocationNode[] = [];

  for (const node of map.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);  // orphan → treat as root
    }
  }

  return roots;
}

export function findById(
  nodes: LocationNode[],
  id: string
): LocationNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findById(n.children, id);
    if (found) return found;
  }
  return null;
}

export function getAncestorPath(
  nodes:    LocationNode[],
  targetId: string,
  path:     LocationNode[] = []
): LocationNode[] | null {
  for (const n of nodes) {
    const current = [...path, n];
    if (n.id === targetId) return current;
    const found = getAncestorPath(n.children, targetId, current);
    if (found) return found;
  }
  return null;
}

export function getFirstLocation(
  nodes: LocationNode[]
): LocationNode | null {
  for (const n of nodes) {
    if (n.type === 'location') return n;
    const found = getFirstLocation(n.children);
    if (found) return found;
  }
  return null;
}

// lib/utils.ts

export function sortConfigFirst(
  data: LocationFunction[]
): LocationFunction[] {
  const configIndex = data.findIndex((fn) =>
    fn.Function_Type_name.toLowerCase().includes('config')
  );

  if (configIndex <= 0) return data; // already first, or not found

  const configItem = data[configIndex];
  const rest = data.filter((_, i) => i !== configIndex);

  return [configItem, ...rest];
}

============

  export function mapRawFunctionsToLocationFunctions(
  data: LocationFunction[]
) {
  const enriched = filterEnabledFunctions(data).map((item) => {
    const config = FUNCTION_MAPPING_BY_ID[item.Function_Type_Id];
    return {
      ...item,
      label: config?.label ?? item.Function_Type_name,
      slug:  config?.slug  ?? item.Function_Type_name.toLowerCase().replace(/\s+/g, '-'),
    };
  });

  return sortConfigFirst(enriched);
}

=====================


  // components/ConfigPage.tsx
'use client';

import { useState } from 'react';

interface ConfigFunction extends LocationFunction {
  label: string;
  slug: string;
  enabled: boolean;
}

export function ConfigPage({
  initialFunctions,
  onToggle,
}: {
  initialFunctions: LocationFunction[];
  onToggle?: (slug: string, enabled: boolean) => void;
}) {
  const [functions, setFunctions] = useState<ConfigFunction[]>(() =>
    initialFunctions.map((fn) => ({
      ...fn,
      enabled: fn.Is_Enabled === 1,
    }))
  );

  const handleToggle = (slug: string) => {
    setFunctions((prev) =>
      prev.map((fn) =>
        fn.slug === slug ? { ...fn, enabled: !fn.enabled } : fn
      )
    );

    const updated = functions.find((fn) => fn.slug === slug);
    if (updated) {
      onToggle?.(slug, !updated.enabled);
    }
  };

  // Skip rendering "Configuration" itself in the toggle list
  const toggleable = functions.filter(
    (fn) => !fn.label.toLowerCase().includes('config')
  );

  return (
    <div>
      <h3>This configuration enables the location features.</h3>
      <div className="grid grid-cols-2 gap-4">
        {toggleable.map((fn) => (
          <label key={fn.slug} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fn.enabled}
              onChange={() => handleToggle(fn.slug)}
              className="toggle"
            />
            {fn.label}
          </label>
        ))}
      </div>
    </div>
  );
}

=========

    // LocationFunctionsShell.tsx
'use client';

import { useState } from 'react';

export function LocationFunctionsShell({
  initialFunctions,
}: {
  initialFunctions: LocationFunction[];
}) {
  const [functions, setFunctions] = useState<ConfigFunction[]>(() =>
    initialFunctions.map((fn) => ({ ...fn, enabled: fn.Is_Enabled === 1 }))
  );

  const handleToggle = (slug: string) => {
    setFunctions((prev) =>
      prev.map((fn) =>
        fn.slug === slug ? { ...fn, enabled: !fn.enabled } : fn
      )
    );
  };

  // Nav only shows enabled tabs + Config always visible
  const navItems = functions.filter(
    (fn) => fn.enabled || fn.label.toLowerCase().includes('config')
  );

  return (
    <div className="flex">
      <nav>
        {navItems.map((fn) => (
          <NavLink key={fn.slug} href={`#${fn.slug}`}>
            {fn.label}
          </NavLink>
        ))}
      </nav>

      <ConfigPage
        initialFunctions={functions}
        onToggle={handleToggle}
      />
    </div>
  );
}

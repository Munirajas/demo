// components/ConfigPage.tsx
'use client';

import { useLocationFunctionsQuery } from '../hooks/useLocationFunctions';
import { useToggleFunction } from '../hooks/useToggleFunction';

export function ConfigPage({ locationId }: { locationId: number }) {
  const { data: functions } = useLocationFunctionsQuery(locationId);
  const toggleFunction = useToggleFunction(locationId);

  if (!functions) return null;

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
              onChange={() => toggleFunction(fn.slug)}
            />
            {fn.label}
          </label>
        ))}
      </div>
    </div>
  );
}

=============

  const navItems = functions.filter(
    (fn) => fn.enabled || fn.label.toLowerCase().includes('config')
  );

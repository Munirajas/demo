// src/modules/functions/noFunctions/NoFunctionsAvailable.tsx
//
// Referenced in LocationShell.tsx (line 32 in your screenshot)
// but never created — this was the missing file causing
// 'NoFunctionsAvailable' is not defined.
//
// Shown when getLocationFunctions(locationId) returns []
// (a valid state — location exists, but nothing enabled).

export function NoFunctionsAvailable({ locationLabel }: { locationLabel: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center
          justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9.17 9a3 3 0 015.66 0M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">
          No functions available for {locationLabel}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Enable features for this location in Configuration.
        </p>
      </div>
    </div>
  );
}

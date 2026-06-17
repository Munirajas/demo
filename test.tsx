// src/app/(protected)/location/[slug]/[fn]/not-found.tsx
// This catches notFound() from [fn]/page.tsx
// Renders ONLY in Col 3 — layout stays intact

export default function FunctionNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center
            rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 
                   10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          Page not available
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          This function page is not yet configured.
        </p>
      </div>
    </div>
  );
}



===============

  // src/app/(protected)/location/[slug]/not-found.tsx
// Catches when slug doesn't match any location
// Renders inside (protected)/layout.tsx so tree sidebar stays

export default function LocationNotFound() {
  return (
    <>
      {/* Col 2 — empty function nav placeholder */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-200
        bg-white" />

      {/* Col 3 — not found message */}
      <main className="flex flex-1 items-center justify-center
        bg-gray-50 p-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center
              rounded-full bg-red-50">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            Location not found
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            The location you're looking for doesn't exist.
          </p>
        </div>
      </main>
    </>
  );
}

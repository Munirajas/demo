'use client';

import { useState, useTransition } from 'react';

// ─── Types (matching your existing plans.types.ts) ────
interface LocationPlan {
  id: number;
  name: string;
}

interface PlanShellProps {
  plans: LocationPlan[];
  locationId: number;
  activePlanId: number | null; // current active plan id
  message: string;
}

// ─── Mock data for preview ────────────────────────────
const MOCK_PLANS: LocationPlan[] = [
  { id: 1, name: 'Basic Plan' },
  { id: 2, name: 'Standard Plan' },
  { id: 3, name: 'Flexible "Buy Now, Pay Later" Plan' },
  { id: 4, name: 'Premium Plan' },
  { id: 5, name: 'Enterprise Plan' },
];

const MOCK_ACTIVE_PLAN_ID = 2;

// ─── Plan metadata (minimal info shown per card) ──────
// In real app this would come from BE as plan gets richer
const PLAN_META: Record<number, { description: string; tag: string }> = {
  1: { description: 'Core ticketing features for getting started.', tag: 'Entry' },
  2: { description: 'Full feature access for growing venues.', tag: 'Popular' },
  3: { description: 'Pay per use with flexible billing cycles.', tag: 'Flexible' },
  4: { description: 'Advanced tools for high-volume operations.', tag: 'Advanced' },
  5: { description: 'Dedicated support and unlimited capacity.', tag: 'Enterprise' },
};

// ─── PlanCard ─────────────────────────────────────────
function PlanCard({
  plan,
  isActive,
  isSelected,
  isUpdating,
  onSelect,
}: {
  plan: LocationPlan;
  isActive: boolean;
  isSelected: boolean;
  isUpdating: boolean;
  onSelect: (id: number) => void;
}) {
  const meta = PLAN_META[plan.id] ?? {
    description: 'Plan details provided by your administrator.',
    tag: 'Plan',
  };

  return (
    <div
      className={[
        'relative flex flex-col rounded-xl border-2 p-5 transition-all duration-200',
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : isSelected
          ? 'border-gray-900 bg-white shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Top row — tag + active badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={[
            'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-600 uppercase tracking-wide',
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500',
          ].join(' ')}
        >
          {meta.tag}
        </span>

        {isActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white opacity-80" />
            Current Plan
          </span>
        )}
      </div>

      {/* Plan name */}
      <h3
        className={[
          'mb-1.5 text-sm font-semibold leading-snug',
          isActive ? 'text-blue-900' : 'text-gray-900',
        ].join(' ')}
      >
        {plan.name}
      </h3>

      {/* Description */}
      <p className="mb-5 flex-1 text-xs leading-relaxed text-gray-500">
        {meta.description}
      </p>

      {/* Plan ID — subtle reference */}
      <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-gray-300">
        Plan #{plan.id}
      </p>

      {/* Action */}
      {isActive ? (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-100/60 px-4 py-2.5">
          <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-blue-700">Active for this location</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(plan.id)}
          disabled={isUpdating}
          className={[
            'w-full rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2',
            isSelected
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900',
            isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          {isSelected && isUpdating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Applying...
            </span>
          ) : (
            'Select Plan'
          )}
        </button>
      )}
    </div>
  );
}

// ─── Active Plan Banner ───────────────────────────────
function ActivePlanBanner({
  plan,
}: {
  plan: LocationPlan;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
          <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
            Active Plan
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {plan.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">Plan #{plan.id}</span>
        <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white">
          Current
        </span>
      </div>
    </div>
  );
}

// ─── Confirm Bar ─────────────────────────────────────
function ConfirmBar({
  selectedPlan,
  isUpdating,
  onConfirm,
  onCancel,
}: {
  selectedPlan: LocationPlan;
  isUpdating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <svg className="h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-amber-800">
          You're about to switch to{' '}
          <span className="font-semibold">{selectedPlan.name}</span>.
          This will update the active plan for this location.
        </p>
      </div>
      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="rounded-lg border border-amber-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isUpdating}
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Applying...
            </>
          ) : (
            'Confirm Switch'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────
function PlansEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">No plans available</p>
      <p className="mt-1 text-xs text-gray-400">
        No plans are currently configured for this location.
      </p>
    </div>
  );
}

// ─── PlanShell — main page component ─────────────────
export function PlanShell({
  plans,
  locationId,
  activePlanId,
  message,
}: PlanShellProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [currentActivePlanId, setCurrentActivePlanId] =
    useState<number | null>(activePlanId);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePlan = plans.find((p) => p.id === currentActivePlanId) ?? null;
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  function handleSelect(planId: number) {
    if (planId === currentActivePlanId) return;
    setSelectedPlanId(planId);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  function handleCancel() {
    setSelectedPlanId(null);
  }

  function handleConfirm() {
    if (!selectedPlanId) return;

    startTransition(async () => {
      try {
        // TODO: replace with your actual useChangePlan mutation
        // const result = await changePlan({ locationId, planId: selectedPlanId });
        
        // Simulating API call for preview
        await new Promise((r) => setTimeout(r, 1200));
        
        setCurrentActivePlanId(selectedPlanId);
        setSelectedPlanId(null);
        setSuccessMessage(
          `Plan switched to "${plans.find((p) => p.id === selectedPlanId)?.name}".`
        );
      } catch {
        setErrorMessage('Failed to switch plan. Please try again.');
      }
    });
  }

  if (plans.length === 0) {
    return (
      <div className="p-6">
        <PlansEmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Plan Selection
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage the plan assigned to this location.
          </p>
        </div>
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
          {plans.length} {plans.length === 1 ? 'plan' : 'plans'} available
        </span>
      </div>

      {/* Active plan banner */}
      {activePlan && (
        <ActivePlanBanner plan={activePlan} />
      )}

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <svg className="h-4 w-4 flex-shrink-0 text-green-500" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium text-green-800">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg className="h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium text-red-800">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Confirm bar — shown when a plan is selected */}
      {selectedPlan && (
        <ConfirmBar
          selectedPlan={selectedPlan}
          isUpdating={isPending}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={plan.id === currentActivePlanId}
            isSelected={plan.id === selectedPlanId}
            isUpdating={isPending}
            onSelect={handleSelect}
          />
        ))}
      </div>

    </div>
  );
}

// ─── Preview App ──────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <PlanShell
          plans={MOCK_PLANS}
          locationId={1}
          activePlanId={MOCK_ACTIVE_PLAN_ID}
          message="Plans loaded successfully"
        />
      </div>
    </div>
  );
}

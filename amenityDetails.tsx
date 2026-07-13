// modules/amenities/lib/constants.ts (add)
export const amenityKeys = {
  // ...existing keys
  generalInfo: (amenityId: number) => ['amenities', 'general', amenityId] as const,
  schedule: (amenityId: number) => ['amenities', 'schedule', amenityId] as const,
};

======================================

  // modules/amenities/hooks/useAmenityGeneralInfo.ts
'use client';

import { useAuthQuery } from '@/modules/auth/hooks/useAuthQuery';
import { amenityKeys } from '../lib/constants';
import { GET_AMENITY_GENERAL_INFO } from '../graphql/amenity.queries';
import type { GeneralInfoValues } from '../types/wizard-types';

const AMENITY_REQUEST_TYPE = 'client' as const;

export function useAmenityGeneralInfo(amenityId: number | null) {
  return useAuthQuery(
    amenityKeys.generalInfo(amenityId ?? -1),
    GET_AMENITY_GENERAL_INFO,
    { type: AMENITY_REQUEST_TYPE, amenityId: amenityId ?? undefined },
    {
      enabled: amenityId !== null,
      select: (data): GeneralInfoValues | null => {
        const d = data.getAmenityGeneralInfo?.data;
        if (!d) return null;
        return {
          amenityTypeId: d.amenityTypeId,
          amenityName: d.amenityName,
          amenityDescription: d.amenityDescription ?? '',
        };
      },
    },
  );
}

==============================

  // modules/amenities/hooks/useAmenitySchedule.ts
'use client';

import { useAuthQuery } from '@/modules/auth/hooks/useAuthQuery';
import { amenityKeys } from '../lib/constants';
import { GET_AMENITY_SCHEDULE } from '../graphql/amenity.queries';
import type { ScheduleSavePayload } from '../lib/recurrence-types';

const AMENITY_REQUEST_TYPE = 'client' as const;

// `enabled` is passed in by the caller so this only fires once the user
// actually reaches the scheduling step -- not eagerly on drawer open.
export function useAmenitySchedule(amenityId: number | null, enabled: boolean) {
  return useAuthQuery(
    amenityKeys.schedule(amenityId ?? -1),
    GET_AMENITY_SCHEDULE,
    { type: AMENITY_REQUEST_TYPE, amenityId: amenityId ?? undefined },
    {
      enabled: enabled && amenityId !== null,
      select: (data): ScheduleSavePayload | null => data.getAmenitySchedule?.data ?? null,
    },
  );
}

=================================


// components/forms/types.ts
export interface AmenityTypeFormProps {
  generalInfo: GeneralInfoValues;
  onGeneralInfoChange: (values: GeneralInfoValues) => void;
  isEditing: boolean;
  amenityId?: number | null; // each form fetches its own details from this
  locationFunctionId: number;
  locationSlug: string;
  onClose: () => void;
}

================================


  'use client';

import { useEffect, useRef, useState } from 'react';
import { useInsertAmenity } from '../../hooks/useInsertAmenity';
import { useUpdateAmenity } from '../../hooks/useUpdateAmenity';
import { useAmenityGeneralInfo } from '../../hooks/useAmenityGeneralInfo';
import { GeneralInfoFields } from '../GeneralInfoFields';
import type { AmenityTypeFormProps } from './types';

export function GeneralAdmissionForm({
  generalInfo,
  onGeneralInfoChange,
  isEditing,
  amenityId,
  locationFunctionId,
  locationSlug,
  onClose,
}: AmenityTypeFormProps) {
  const [error, setError] = useState<string | null>(null);
  const hasHydrated = useRef(false); // guards against a background refetch clobbering user edits

  const {
    data: fetchedGeneralInfo,
    isLoading,
    isError,
    error: fetchError,
  } = useAmenityGeneralInfo(isEditing ? amenityId ?? null : null);

  useEffect(() => {
    if (fetchedGeneralInfo && !hasHydrated.current) {
      onGeneralInfoChange(fetchedGeneralInfo);
      hasHydrated.current = true;
    }
  }, [fetchedGeneralInfo, onGeneralInfoChange]);

  const insert = useInsertAmenity(locationFunctionId, locationSlug);
  const update = useUpdateAmenity(locationFunctionId, locationSlug);
  const isSaving = insert.isPending || update.isPending;
  const isLoadingInitial = isEditing && isLoading && !hasHydrated.current;

  function validate(): boolean {
    if (!generalInfo.amenityTypeId) { setError('Please select an amenity type.'); return false; }
    if (!generalInfo.amenityName.trim()) { setError('Name is required.'); return false; }
    setError(null);
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const payload = {
      amenityTypeId: Number(generalInfo.amenityTypeId),
      amenityName: generalInfo.amenityName.trim(),
      amenityDescription: generalInfo.amenityDescription.trim(),
    };
    if (isEditing && amenityId) {
      update.mutate({ amenityId, locationFunctionId, ...payload }, { onSuccess: onClose });
    } else {
      insert.mutate({ locationFunctionId, ...payload }, { onSuccess: onClose });
    }
  }

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-9 bg-gray-100 rounded-md" />
        <div className="h-24 bg-gray-100 rounded-md" />
      </div>
    );
  }

  if (isEditing && isError) {
    return <p className="text-sm text-red-600">Couldn't load this amenity. {fetchError?.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <GeneralInfoFields values={generalInfo} onChange={onGeneralInfoChange} error={error} />
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-1">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Cancel</button>
        <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

=======================================

  'use client';

import { useEffect, useRef, useState } from 'react';
import { useInsertAmenity } from '../../hooks/useInsertAmenity';
import { useUpdateAmenity } from '../../hooks/useUpdateAmenity';
import { useAmenityGeneralInfo } from '../../hooks/useAmenityGeneralInfo';
import { useAmenitySchedule } from '../../hooks/useAmenitySchedule';
import { GeneralInfoFields } from '../GeneralInfoFields';
import { RecurrenceRuleBuilder } from '../schedule/RecurrenceRuleBuilder';
import { StepIndicator, type StepIndicatorStep } from '../StepIndicator';
import { buildScheduleSavePayload } from '../../lib/recurrence-engine';
import { EMPTY_RECURRENCE_RULE, type RecurrenceRuleValues } from '../../lib/recurrence-types';
import type { AmenityTypeFormProps } from './types';

type Step = 'general' | 'scheduler';

export function ScheduledAdmissionForm({
  generalInfo,
  onGeneralInfoChange,
  isEditing,
  amenityId,
  locationFunctionId,
  locationSlug,
  onClose,
}: AmenityTypeFormProps) {
  const [step, setStep] = useState<Step>('general');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRuleValues>(EMPTY_RECURRENCE_RULE);
  const [error, setError] = useState<string | null>(null);

  const hasHydratedGeneral = useRef(false);
  const hasHydratedSchedule = useRef(false);

  // Step 1's own fetch.
  const {
    data: fetchedGeneralInfo,
    isLoading: isLoadingGeneral,
    isError: isGeneralError,
    error: generalError,
  } = useAmenityGeneralInfo(isEditing ? amenityId ?? null : null);

  useEffect(() => {
    if (fetchedGeneralInfo && !hasHydratedGeneral.current) {
      onGeneralInfoChange(fetchedGeneralInfo);
      hasHydratedGeneral.current = true;
    }
  }, [fetchedGeneralInfo, onGeneralInfoChange]);

  // Step 2's own fetch -- only enabled once the user is actually on this step.
  const {
    data: fetchedSchedule,
    isLoading: isLoadingSchedule,
    isError: isScheduleError,
    error: scheduleError,
  } = useAmenitySchedule(isEditing ? amenityId ?? null : null, step === 'scheduler');

  useEffect(() => {
    if (fetchedSchedule?.rule && !hasHydratedSchedule.current) {
      setRecurrenceRule(fetchedSchedule.rule);
      hasHydratedSchedule.current = true;
    }
  }, [fetchedSchedule]);

  const insert = useInsertAmenity(locationFunctionId, locationSlug);
  const update = useUpdateAmenity(locationFunctionId, locationSlug);
  const isSaving = insert.isPending || update.isPending;

  const steps: StepIndicatorStep[] = [
    { id: 'general', label: 'General info', status: step === 'general' ? 'active' : 'done' },
    { id: 'scheduler', label: 'Scheduling', status: step === 'scheduler' ? 'active' : 'pending' },
  ];

  function validateGeneralInfo(): boolean {
    if (!generalInfo.amenityTypeId) { setError('Please select an amenity type.'); return false; }
    if (!generalInfo.amenityName.trim()) { setError('Name is required.'); return false; }
    setError(null);
    return true;
  }

  function validateSchedule(): boolean {
    if (!recurrenceRule.startDate || !recurrenceRule.endDate) { setError('Start and end date are required.'); return false; }
    if (recurrenceRule.frequency === 'WEEKLY' && recurrenceRule.daysOfWeek.length === 0) { setError('Select at least one day.'); return false; }
    setError(null);
    return true;
  }

  function handleNext() {
    if (!validateGeneralInfo()) return;
    setStep('scheduler');
  }

  function handleSave() {
    if (!validateSchedule()) return;
    const payload = {
      amenityTypeId: Number(generalInfo.amenityTypeId),
      amenityName: generalInfo.amenityName.trim(),
      amenityDescription: generalInfo.amenityDescription.trim(),
      schedule: buildScheduleSavePayload(recurrenceRule),
    };
    if (isEditing && amenityId) {
      update.mutate({ amenityId, locationFunctionId, ...payload }, { onSuccess: onClose });
    } else {
      insert.mutate({ locationFunctionId, ...payload }, { onSuccess: onClose });
    }
  }

  const isLoadingInitialGeneral = isEditing && isLoadingGeneral && !hasHydratedGeneral.current;
  const isLoadingInitialSchedule = isEditing && isLoadingSchedule && !hasHydratedSchedule.current;

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator steps={steps} onStepClick={(i) => setStep(i === 0 ? 'general' : 'scheduler')} />

      {step === 'general' ? (
        isLoadingInitialGeneral ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-9 bg-gray-100 rounded-md" />
            <div className="h-24 bg-gray-100 rounded-md" />
          </div>
        ) : isGeneralError ? (
          <p className="text-sm text-red-600">Couldn't load general info. {generalError?.message}</p>
        ) : (
          <>
            <GeneralInfoFields values={generalInfo} onChange={onGeneralInfoChange} error={error} />
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Cancel</button>
              <button type="button" onClick={handleNext} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white">Next</button>
            </div>
          </>
        )
      ) : isLoadingInitialSchedule ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-9 bg-gray-100 rounded-md" />
          <div className="h-9 bg-gray-100 rounded-md" />
          <div className="h-32 bg-gray-100 rounded-md" />
        </div>
      ) : isScheduleError ? (
        <p className="text-sm text-red-600">Couldn't load the schedule. {scheduleError?.message}</p>
      ) : (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <RecurrenceRuleBuilder value={recurrenceRule} onChange={setRecurrenceRule} />
          <div className="flex justify-between gap-2 pt-3 border-t border-gray-100 mt-1">
            <button type="button" onClick={() => setStep('general')} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Back</button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Cancel</button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-60">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

===================================

  // components/AmenityFormDrawer.tsx (relevant parts)
interface EditingAmenitySummary {
  amenityId: number;
  amenityTypeId: number; // already known from the table row -- no fetch needed to pick the form
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  locationFunctionId: number;
  locationSlug: string;
  amenityTypes: AmenityType[];
  editingAmenity?: EditingAmenitySummary | null;
}

export function AmenityFormDrawer({
  isOpen, onClose, locationFunctionId, locationSlug, amenityTypes, editingAmenity = null,
}: Props) {
  const isEditing = editingAmenity !== null;
  const [generalInfo, setGeneralInfo] = useState<GeneralInfoValues>(EMPTY_GENERAL_INFO);

  const originalWizardKind = useMemo(
    () => (editingAmenity ? resolveWizardKind(editingAmenity.amenityTypeId, amenityTypes) : null),
    [editingAmenity, amenityTypes],
  );

  useEffect(() => {
    if (!isOpen) return;
    // Only seed amenityTypeId here (to route to the right component).
    // Name/description are fetched and seeded by whichever step-1 form
    // mounts below -- not duplicated here.
    setGeneralInfo(
      editingAmenity
        ? { amenityTypeId: editingAmenity.amenityTypeId, amenityName: '', amenityDescription: '' }
        : EMPTY_GENERAL_INFO,
    );
  }, [isOpen, editingAmenity]);

  const wizardKind = resolveWizardKind(generalInfo.amenityTypeId, amenityTypes);
  const ActiveForm = AMENITY_FORM_REGISTRY[wizardKind];

  // ...dropdown + downgrade warning JSX unchanged...

  return (
    <Drawer title={isEditing ? 'Edit amenity' : 'Add amenity'} width="sm" isOpen={isOpen} onClose={onClose}>
      {/* dropdown + warning here */}
      {generalInfo.amenityTypeId !== '' && ActiveForm && (
        <ActiveForm
          key={wizardKind}
          generalInfo={generalInfo}
          onGeneralInfoChange={setGeneralInfo}
          isEditing={isEditing}
          amenityId={editingAmenity?.amenityId ?? null}
          locationFunctionId={locationFunctionId}
          locationSlug={locationSlug}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}


===================================


  <AmenityFormDrawer
  isOpen={drawer.mode !== 'closed'}
  editingAmenity={
    drawer.mode === 'edit'
      ? { amenityId: drawer.amenity.amenityId, amenityTypeId: drawer.amenity.amenityTypeId }
      : null
  }
  onClose={() => setDrawer({ mode: 'closed' })}
  locationFunctionId={locationFunctionId}
  locationSlug={locationSlug}
  amenityTypes={amenityTypes}
/>



=====











  

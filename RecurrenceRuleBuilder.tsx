'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  RecurrenceRuleValues,
  WeekDay,
  SetPosition,
  Frequency,
} from '../../lib/schedule-recurrence-types';
import { recurrenceRuleSchema } from '../../lib/schedule-recurrence-schema';
import { addYears } from '../../lib/schedule-recurrence-defaults';

const ALL_DAYS: { key: WeekDay; label: string }[] = [
  { key: 'SUN', label: 'Sun' },
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
];

const SET_POSITIONS: { value: SetPosition; label: string }[] = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface RecurrenceRuleBuilderHandle {
  validate: () => Promise<boolean>;
}

interface Props {
  value: RecurrenceRuleValues;
  onChange: (value: RecurrenceRuleValues) => void;
  error?: string | null;
}

export const RecurrenceRuleBuilder = forwardRef<RecurrenceRuleBuilderHandle, Props>(
  function RecurrenceRuleBuilder({ value, onChange, error }, ref) {
    function patch(partial: Partial<RecurrenceRuleValues>) {
      onChange({ ...value, ...partial });
    }

    function toggleDay(day: WeekDay) {
      const has = value.daysOfWeek.includes(day);
      patch({
        daysOfWeek: has
          ? value.daysOfWeek.filter((d) => d !== day)
          : [...value.daysOfWeek, day],
      });
    }

    const isRecurring = value.frequency !== 'NONE';

    function handleRecurringToggle(checked: boolean) {
      if (checked) {
        patch({
          frequency: 'WEEKLY',
          recurrenceEndDate: value.recurrenceEndDate || addYears(value.startDate, 1),
        });
      } else {
        patch({ frequency: 'NONE' });
      }
    }

    const [attempted, setAttempted] = useState(false);

    const {
      trigger,
      formState: { errors: rawErrors },
    } = useForm<RecurrenceRuleValues>({
      resolver: zodResolver(recurrenceRuleSchema),
      values: value,
      mode: 'onSubmit',
    });

    useImperativeHandle(ref, () => ({
      validate: async () => {
        setAttempted(true);
        return trigger();
      },
    }));

    useEffect(() => {
      if (attempted) trigger();
    }, [value, attempted, trigger]);

    const errors = attempted ? rawErrors : ({} as typeof rawErrors);

    return (
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Start</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={value.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
              />
              <input
                type="time"
                className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={value.startTime}
                onChange={(e) => patch({ startTime: e.target.value })}
              />
            </div>
            {(errors.startDate || errors.startTime) && (
              <p className="text-xs text-red-600 mt-1">
                {errors.startDate?.message ?? errors.startTime?.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">End</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={value.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
              />
              <input
                type="time"
                className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={value.endTime}
                onChange={(e) => patch({ endTime: e.target.value })}
              />
            </div>
            {(errors.endDate || errors.endTime) && (
              <p className="text-xs text-red-600 mt-1">
                {errors.endDate?.message ?? errors.endTime?.message}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          The gap between start and end is reused as the duration for every generated occurrence.
        </p>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Recurring</span>
          <button
            type="button"
            role="switch"
            aria-checked={isRecurring}
            onClick={() => handleRecurringToggle(!isRecurring)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isRecurring ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isRecurring ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {isRecurring && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={value.frequency}
                onChange={(e) => patch({ frequency: e.target.value as Frequency })}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            {value.frequency === 'DAILY' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Recur every</span>
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={value.interval}
                  onChange={(e) => patch({ interval: Number(e.target.value) || 1 })}
                />
                <span className="text-sm text-gray-600">day(s)</span>
                {errors.interval && (
                  <p className="text-xs text-red-600 mt-1">{errors.interval.message}</p>
                )}
              </div>
            )}

            {value.frequency === 'WEEKLY' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Recur every</span>
                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={value.interval}
                    onChange={(e) => patch({ interval: Number(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-gray-600">week(s)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Days of the week</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => {
                      const active = value.daysOfWeek.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.daysOfWeek && (
                    <p className="text-xs text-red-600 mt-1">{errors.daysOfWeek.message as string}</p>
                  )}
                </div>
              </>
            )}

            {value.frequency === 'MONTHLY' && (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
                <label className="text-sm font-medium text-gray-700">Recurrence pattern</label>

                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="radio"
                    id="monthlyDayMode"
                    checked={value.monthlyMode === 'DAY_OF_MONTH'}
                    onChange={() => patch({ monthlyMode: 'DAY_OF_MONTH' })}
                  />
                  <label htmlFor="monthlyDayMode" className="text-sm text-gray-700">
                    Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={value.monthlyMode !== 'DAY_OF_MONTH'}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.monthlyDayOfMonth}
                    onChange={(e) => patch({ monthlyDayOfMonth: Number(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-gray-600">of every</span>
                  <input
                    type="number"
                    min={1}
                    disabled={value.monthlyMode !== 'DAY_OF_MONTH'}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.interval}
                    onChange={(e) => patch({ interval: Number(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-gray-600">month(s)</span>
                </div>
                {value.monthlyMode === 'DAY_OF_MONTH' && errors.monthlyDayOfMonth && (
                  <p className="text-xs text-red-600">{errors.monthlyDayOfMonth.message}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="radio"
                    id="monthlyPosMode"
                    checked={value.monthlyMode === 'WEEKDAY_POSITION'}
                    onChange={() => patch({ monthlyMode: 'WEEKDAY_POSITION' })}
                  />
                  <label htmlFor="monthlyPosMode" className="text-sm text-gray-700">
                    The
                  </label>
                  <select
                    disabled={value.monthlyMode !== 'WEEKDAY_POSITION'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.monthlySetPosition}
                    onChange={(e) =>
                      patch({ monthlySetPosition: Number(e.target.value) as SetPosition })
                    }
                  >
                    {SET_POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    disabled={value.monthlyMode !== 'WEEKDAY_POSITION'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.monthlyWeekday}
                    onChange={(e) => patch({ monthlyWeekday: e.target.value as WeekDay })}
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">of every</span>
                  <input
                    type="number"
                    min={1}
                    disabled={value.monthlyMode !== 'WEEKDAY_POSITION'}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.interval}
                    onChange={(e) => patch({ interval: Number(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-gray-600">month(s)</span>
                </div>
              </div>
            )}

            {value.frequency === 'YEARLY' && (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
                <label className="text-sm font-medium text-gray-700">Recurrence pattern</label>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Recur every</span>
                  <input
                    type="number"
                    min={1}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    value={value.interval}
                    onChange={(e) => patch({ interval: Number(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-gray-600">year(s)</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="radio"
                    id="yearlyOnDate"
                    checked={value.yearlyMode === 'ON_DATE'}
                    onChange={() => patch({ yearlyMode: 'ON_DATE' })}
                  />
                  <label htmlFor="yearlyOnDate" className="text-sm text-gray-700 w-12">
                    On:
                  </label>
                  <select
                    disabled={value.yearlyMode !== 'ON_DATE'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.yearlyMonth}
                    onChange={(e) => patch({ yearlyMonth: Number(e.target.value) })}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={value.yearlyMode !== 'ON_DATE'}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.yearlyDayOfMonth}
                    onChange={(e) => patch({ yearlyDayOfMonth: Number(e.target.value) || 1 })}
                  />
                </div>
                {value.yearlyMode === 'ON_DATE' && errors.yearlyDayOfMonth && (
                  <p className="text-xs text-red-600">{errors.yearlyDayOfMonth.message}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="radio"
                    id="yearlyPosMode"
                    checked={value.yearlyMode === 'WEEKDAY_POSITION'}
                    onChange={() => patch({ yearlyMode: 'WEEKDAY_POSITION' })}
                  />
                  <label htmlFor="yearlyPosMode" className="text-sm text-gray-700 w-12">
                    On the:
                  </label>
                  <select
                    disabled={value.yearlyMode !== 'WEEKDAY_POSITION'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.yearlySetPosition}
                    onChange={(e) =>
                      patch({ yearlySetPosition: Number(e.target.value) as SetPosition })
                    }
                  >
                    {SET_POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    disabled={value.yearlyMode !== 'WEEKDAY_POSITION'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.yearlyWeekday}
                    onChange={(e) => patch({ yearlyWeekday: e.target.value as WeekDay })}
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">of</span>
                  <select
                    disabled={value.yearlyMode !== 'WEEKDAY_POSITION'}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                    value={value.yearlyMonth}
                    onChange={(e) => patch({ yearlyMonth: Number(e.target.value) })}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Recurrence ends</label>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="endOnDate"
                  checked={value.recurrenceEndMode === 'ON_DATE'}
                  onChange={() => patch({ recurrenceEndMode: 'ON_DATE' })}
                />
                <label htmlFor="endOnDate" className="text-sm text-gray-700 w-20">
                  End by
                </label>
                <input
                  type="date"
                  disabled={value.recurrenceEndMode !== 'ON_DATE'}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                  value={value.recurrenceEndDate ?? ''}
                  onChange={(e) => patch({ recurrenceEndDate: e.target.value })}
                />
              </div>
              {value.recurrenceEndMode === 'ON_DATE' && errors.recurrenceEndDate && (
                <p className="text-xs text-red-600">{errors.recurrenceEndDate.message}</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="endAfter"
                  checked={value.recurrenceEndMode === 'AFTER_OCCURRENCES'}
                  onChange={() => patch({ recurrenceEndMode: 'AFTER_OCCURRENCES' })}
                />
                <label htmlFor="endAfter" className="text-sm text-gray-700 w-20">
                  End after
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={value.recurrenceEndMode !== 'AFTER_OCCURRENCES'}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                  value={value.occurrenceCount ?? ''}
                  onChange={(e) => patch({ occurrenceCount: Number(e.target.value) || undefined })}
                />
                <span className="text-sm text-gray-600">occurrences</span>
              </div>
              {value.recurrenceEndMode === 'AFTER_OCCURRENCES' && errors.occurrenceCount && (
                <p className="text-xs text-red-600">{errors.occurrenceCount.message}</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="noEndDate"
                  checked={value.recurrenceEndMode === 'NEVER'}
                  onChange={() => patch({ recurrenceEndMode: 'NEVER' })}
                />
                <label htmlFor="noEndDate" className="text-sm text-gray-700">
                  No end date
                </label>
              </div>

              {value.recurrenceEndMode === 'NEVER' && (
                <p className="text-xs text-gray-500">
                  Occurrences are generated up to 2 years out; more are added automatically as that window approaches.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  },
);

========================================

  import { useRef } from 'react';
import { RecurrenceRuleBuilder, type RecurrenceRuleBuilderHandle } from '../schedule/RecurrenceRuleBuilder';
import { buildDefaultRecurrenceRule } from '../../lib/schedule-recurrence-defaults';

const scheduleRef = useRef<RecurrenceRuleBuilderHandle>(null);

const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRuleValues>(
  () => buildDefaultRecurrenceRule(),
);

async function handleSave() {
  const isValid = await scheduleRef.current?.validate();
  if (!isValid) return;

  if (!validateSchedule()) return; // existing checks, unchanged
  // ...rest of your existing handleSave logic, unchanged
}

=======================

  <RecurrenceRuleBuilder
  ref={scheduleRef}
  value={recurrenceRule}
  onChange={setRecurrenceRule}
  error={error}
/>

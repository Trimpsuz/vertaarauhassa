'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { DURATION_STEP, defaultTrainTypeFilters, filterJourneys, getDurationBounds, sortJourneys, type SortKey, type TimeRange, type TrainTypeFilters, type TrainTypeKey } from '@/lib/journey';
import { filtersQueryUpdates, updateQuery, type JourneyFilterState } from '@/lib/query';
import type { JourneyResult } from '@/lib/utils';

export interface JourneyFilters {
  changeCount: string;
  setChangeCount: (value: string) => void;
  trainTypes: TrainTypeFilters;
  setTrainType: (type: TrainTypeKey, allowed: boolean) => void;
  hideSoldOut: boolean;
  setHideSoldOut: (value: boolean) => void;
  departureTime: TimeRange;
  setDepartureTime: (value: TimeRange) => void;
  arrivalTime: TimeRange;
  setArrivalTime: (value: TimeRange) => void;
  allowedDepartureDays: number[];
  setAllowedDepartureDays: (value: number[]) => void;
  allowedArrivalDays: number[];
  setAllowedArrivalDays: (value: number[]) => void;
  durationRange: number[] | null;
  setDurationRange: (value: number[] | null) => void;
  durationBounds: [number, number];
  sliderBounds: [number, number];
  sort: SortKey;
  setSort: (value: SortKey) => void;
  reverse: boolean;
  setReverse: (value: boolean) => void;
  filteredResults: JourneyResult[];
  sortedResults: JourneyResult[];
  visibleResultIds: Set<string>;
}

export function useJourneyFilters(results: JourneyResult[], initial?: JourneyFilterState): JourneyFilters {
  const [changeCount, setChangeCount] = useState(initial?.changeCount ?? 'any');
  const [trainTypes, setTrainTypes] = useState(initial?.trainTypes ?? defaultTrainTypeFilters);
  const [hideSoldOut, setHideSoldOut] = useState(initial?.hideSoldOut ?? true);
  const [departureTime, setDepartureTime] = useState<TimeRange>(initial?.departureTime ?? { start: '00:00', end: '23:59' });
  const [arrivalTime, setArrivalTime] = useState<TimeRange>(initial?.arrivalTime ?? { start: '00:00', end: '23:59' });
  const [allowedDepartureDays, setAllowedDepartureDays] = useState(initial?.allowedDepartureDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [allowedArrivalDays, setAllowedArrivalDays] = useState(initial?.allowedArrivalDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [durationRange, setDurationRange] = useState<number[] | null>(initial?.durationRange ?? null);
  const [sort, setSort] = useState<SortKey>(initial?.sort ?? 'startTime');
  const [reverse, setReverse] = useState(initial?.reverse ?? false);

  useEffect(() => {
    updateQuery(filtersQueryUpdates({ changeCount, trainTypes, hideSoldOut, departureTime, arrivalTime, allowedDepartureDays, allowedArrivalDays, durationRange, sort, reverse }));
  }, [changeCount, trainTypes, hideSoldOut, departureTime, arrivalTime, allowedDepartureDays, allowedArrivalDays, durationRange, sort, reverse]);

  const durationBounds = useMemo<[number, number]>(() => getDurationBounds(results), [results]);
  const sliderBounds = useMemo<[number, number]>(() => [Math.floor(durationBounds[0] / DURATION_STEP) * DURATION_STEP, Math.ceil(durationBounds[1] / DURATION_STEP) * DURATION_STEP], [durationBounds]);
  const deferredDurationRange = useDeferredValue(durationRange);

  const filteredResults = useMemo(
    () =>
      filterJourneys(results, {
        changeCount,
        trainTypes,
        hideSoldOut,
        departureTime,
        arrivalTime,
        allowedDepartureDays,
        allowedArrivalDays,
        durationRange: deferredDurationRange,
      }),
    [results, changeCount, trainTypes, hideSoldOut, departureTime, arrivalTime, allowedDepartureDays, allowedArrivalDays, deferredDurationRange],
  );
  const sortedResults = useMemo(() => sortJourneys(results, sort, reverse), [results, sort, reverse]);
  const visibleResultIds = useMemo(() => new Set<string>(filteredResults.map((result) => result.id)), [filteredResults]);

  const setTrainType = (type: TrainTypeKey, allowed: boolean) => setTrainTypes((prev) => ({ ...prev, [type]: allowed }));

  return {
    changeCount,
    setChangeCount,
    trainTypes,
    setTrainType,
    hideSoldOut,
    setHideSoldOut,
    departureTime,
    setDepartureTime,
    arrivalTime,
    setArrivalTime,
    allowedDepartureDays,
    setAllowedDepartureDays,
    allowedArrivalDays,
    setAllowedArrivalDays,
    durationRange,
    setDurationRange,
    durationBounds,
    sliderBounds,
    sort,
    setSort,
    reverse,
    setReverse,
    filteredResults,
    sortedResults,
    visibleResultIds,
  };
}

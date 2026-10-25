import { allWeekdays, initialPassengers, MAX_PASSENGERS, passengerTypes, type PassengerCounts } from './constants';
import { defaultTrainTypeFilters, sortOptions, trainTypeOptions, transferOptions, type JourneyFilterCriteria, type SortKey, type TimeRange, type TrainTypeFilters } from './journey';

interface QueryParams {
  get(name: string): string | null;
}

export interface SearchQueryState {
  step: number;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  passengers: PassengerCounts;
}

export interface JourneyFilterState extends JourneyFilterCriteria {
  sort: SortKey;
  reverse: boolean;
}

export interface QueryState extends SearchQueryState {
  filters: JourneyFilterState;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const FULL_DAY: TimeRange = { start: '00:00', end: '23:59' };

const parseDate = (value: string | null) => (value && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) ? value : '');

const parseCount = (value: string | null, fallback: number) => (value !== null && /^\d+$/.test(value) ? Math.min(Number(value), MAX_PASSENGERS) : fallback);

const parsePassengers = (params: QueryParams): PassengerCounts => {
  const passengers = { ...initialPassengers };
  let total = 0;

  for (const { key } of passengerTypes) {
    const count = Math.min(parseCount(params.get(key), initialPassengers[key]), MAX_PASSENGERS - total);
    passengers[key] = count;
    total += count;
  }

  return passengers;
};

const parseCompactTime = (value: string | undefined) => {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const time = `${value.slice(0, 2)}:${value.slice(2)}`;
  return TIME_PATTERN.test(time) ? time : null;
};

const parseTimeRange = (value: string | null): TimeRange => {
  const [start, end] = (value ?? '').split('-');
  const startTime = parseCompactTime(start);
  const endTime = parseCompactTime(end);
  return startTime && endTime ? { start: startTime, end: endTime } : FULL_DAY;
};

const parseDays = (value: string | null, fallback: number[]) => {
  if (value === null) return fallback;
  return [
    ...new Set(
      value
        .split('')
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ].sort((a, b) => a - b);
};

const parseTrainTypes = (value: string | null): TrainTypeFilters => {
  if (value === null) return { ...defaultTrainTypeFilters };
  const enabled = new Set(value.split(','));
  return Object.fromEntries(trainTypeOptions.map(({ key }) => [key, enabled.has(key)])) as TrainTypeFilters;
};

const parseDuration = (value: string | null): number[] | null => {
  if (!value || !/^\d+-\d+$/.test(value)) return null;
  const [min, max] = value.split('-').map(Number);
  return max >= min ? [min, max] : null;
};

const parseSort = (value: string | null): SortKey => (sortOptions.some((option) => option.value === value) ? (value as SortKey) : 'startTime');

const parseFilters = (params: QueryParams): JourneyFilterState => {
  const transfers = params.get('transfers');

  return {
    changeCount: transferOptions.some((option) => option.value === transfers && option.value !== 'any') ? transfers! : 'any',
    trainTypes: parseTrainTypes(params.get('types')),
    hideSoldOut: params.get('hideSoldOut') !== '0',
    departureTime: parseTimeRange(params.get('dep')),
    arrivalTime: parseTimeRange(params.get('arr')),
    allowedDepartureDays: parseDays(params.get('depDays'), allWeekdays),
    allowedArrivalDays: parseDays(params.get('arrDays'), allWeekdays),
    durationRange: parseDuration(params.get('dur')),
    sort: parseSort(params.get('sort')),
    reverse: params.get('reverse') === '1',
  };
};

export function parseQuery(params: QueryParams): QueryState {
  const origin = params.get('from')?.trim().toUpperCase() ?? '';
  const destination = params.get('to')?.trim().toUpperCase() ?? '';
  const startDate = parseDate(params.get('start'));
  const endDate = parseDate(params.get('end'));
  const passengers = parsePassengers(params);
  const passengersTotal = Object.values(passengers).reduce((sum, count) => sum + count, 0);

  // Never restore a stage the stored options cannot support.
  const maxStep = !origin || !destination || origin === destination ? 1 : !startDate || !endDate ? 2 : passengersTotal === 0 ? 3 : 4;
  const rawStep = params.get('step');
  const requestedStep = rawStep === null ? 1 : Number(rawStep);
  const step = Math.min(Number.isInteger(requestedStep) && requestedStep >= 1 ? requestedStep : 1, maxStep);

  return {
    step,
    origin,
    destination,
    startDate,
    endDate,
    passengers,
    filters: parseFilters(params),
  };
}

export function searchQueryUpdates({ step, origin, destination, startDate, endDate, passengers }: SearchQueryState) {
  const updates: Record<string, string | null> = {
    step: step === 1 ? null : String(step),
    from: origin || null,
    to: destination || null,
    start: startDate || null,
    end: endDate || null,
  };

  for (const { key } of passengerTypes) {
    updates[key] = passengers[key] === initialPassengers[key] ? null : String(passengers[key]);
  }

  return updates;
}

const compactTimeRange = (range: TimeRange) => (range.start === FULL_DAY.start && range.end === FULL_DAY.end ? null : `${range.start.replace(':', '')}-${range.end.replace(':', '')}`);

const daysUpdate = (days: number[]) => (days.length === allWeekdays.length ? null : [...days].sort((a, b) => a - b).join(''));

export function filtersQueryUpdates({ sort, reverse, ...criteria }: JourneyFilterState) {
  const enabledTypes = trainTypeOptions.filter(({ key }) => criteria.trainTypes[key]).map(({ key }) => key);

  return {
    transfers: criteria.changeCount === 'any' ? null : criteria.changeCount,
    types: enabledTypes.length === trainTypeOptions.length ? null : enabledTypes.join(','),
    hideSoldOut: criteria.hideSoldOut ? null : '0',
    dep: compactTimeRange(criteria.departureTime),
    arr: compactTimeRange(criteria.arrivalTime),
    depDays: daysUpdate(criteria.allowedDepartureDays),
    arrDays: daysUpdate(criteria.allowedArrivalDays),
    dur: criteria.durationRange ? criteria.durationRange.join('-') : null,
    sort: sort === 'startTime' ? null : sort,
    reverse: reverse ? '1' : null,
  };
}

export function updateQuery(updates: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }

  const search = params.toString();
  if (search === window.location.search.slice(1)) return;

  window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`);
}

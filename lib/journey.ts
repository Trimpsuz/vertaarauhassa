import { inRange, type JourneyResult } from './utils';

export const DURATION_STEP = 5;

export const getDurationMinutes = (result: Pick<JourneyResult, 'arrivalTime' | 'departureTime'>) =>
  (new Date(result.arrivalTime).getTime() - new Date(result.departureTime).getTime()) / 60000;

export interface TimeRange {
  start: string;
  end: string;
}

export type TrainTypeKey = 'pendolino' | 'interCity' | 'night' | 'commuter' | 'bus' | 'railCar';
export type TrainTypeFilters = Record<TrainTypeKey, boolean>;

export const trainTypeOptions: { key: TrainTypeKey; label: string; labelId: string; types: string[] }[] = [
  { key: 'pendolino', label: 'Pendolino', labelId: 'pendolino-label', types: ['S'] },
  { key: 'interCity', label: 'InterCity', labelId: 'intercity-label', types: ['IC'] },
  { key: 'night', label: 'Yöjuna', labelId: 'night-label', types: ['PYO'] },
  { key: 'commuter', label: 'Lähijuna', labelId: 'commuter-label', types: ['LOL'] },
  { key: 'bus', label: 'Ratatyöbussi', labelId: 'bus-label', types: ['JLA', 'BLV'] },
  { key: 'railCar', label: 'Kiskobussi', labelId: 'railcar-label', types: ['HDM'] },
];

export const defaultTrainTypeFilters: TrainTypeFilters = {
  pendolino: true,
  interCity: true,
  night: true,
  commuter: true,
  bus: true,
  railCar: true,
};

export const transferOptions = [
  { value: 'any', label: 'Kaikki' },
  { value: 'direct', label: 'Vain suorat' },
  { value: '1', label: 'Yksi tai vähemmän' },
  { value: '2', label: 'Kaksi tai vähemmän' },
];

export type SortKey = 'startTime' | 'endTime' | 'duration' | 'price' | 'transfers' | 'fill';

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'startTime', label: 'Lähtöaika' },
  { value: 'endTime', label: 'Saapumisaika' },
  { value: 'duration', label: 'Kesto' },
  { value: 'price', label: 'Hinta' },
  { value: 'transfers', label: 'Vaihtojen määrä' },
  { value: 'fill', label: 'Täyttöaste' },
];

export interface JourneyFilterCriteria {
  changeCount: string;
  trainTypes: TrainTypeFilters;
  hideSoldOut: boolean;
  departureTime: TimeRange;
  arrivalTime: TimeRange;
  allowedDepartureDays: number[];
  allowedArrivalDays: number[];
  durationRange: number[] | null;
}

export const getDurationBounds = (results: JourneyResult[]): [number, number] => {
  if (results.length === 0) return [0, 0];
  const durations = results.map(getDurationMinutes);
  return [Math.min(...durations), Math.max(...durations)];
};

export const filterJourneys = (results: JourneyResult[], criteria: JourneyFilterCriteria) =>
  results.filter((result) => {
    const legs = result.legs ?? [];

    const matchesType = trainTypeOptions.every(({ key, types }) => criteria.trainTypes[key] || !legs.some((leg) => types.includes(leg.trainType)));

    const { changeCount } = criteria;
    const matchesTransfers =
      changeCount === 'any' || (changeCount === 'direct' && result.transfers === 0) || (!['any', 'direct'].includes(changeCount) && result.transfers <= Number(changeCount));

    const soldOut = criteria.hideSoldOut && result.error === 'SOLD_OUT';

    const matchesTime =
      inRange(result.departureTime.substring(11, 16), criteria.departureTime.start, criteria.departureTime.end) &&
      inRange(result.arrivalTime.substring(11, 16), criteria.arrivalTime.start, criteria.arrivalTime.end);

    const matchesDays =
      criteria.allowedDepartureDays.includes(new Date(result.departureTime).getDay()) && criteria.allowedArrivalDays.includes(new Date(result.arrivalTime).getDay());

    const duration = getDurationMinutes(result);
    const matchesDuration = !criteria.durationRange || (duration >= criteria.durationRange[0] && duration <= criteria.durationRange[1]);

    return matchesType && matchesTransfers && !soldOut && matchesTime && matchesDays && matchesDuration;
  });

export const sortJourneys = (results: JourneyResult[], sort: SortKey, reverse: boolean) =>
  [...results].sort((a, b) => {
    if (sort === 'startTime') {
      return reverse ? new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime() : new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    }
    if (sort === 'endTime') {
      return reverse ? new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime() : new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    }
    if (sort === 'duration') {
      const durA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime();
      const durB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime();
      return reverse ? durB - durA : durA - durB;
    }
    if (sort === 'price') {
      return reverse ? b.totalPriceCents - a.totalPriceCents : a.totalPriceCents - b.totalPriceCents;
    }
    if (sort === 'transfers') {
      return reverse ? b.transfers - a.transfers : a.transfers - b.transfers;
    }
    if (sort === 'fill') {
      return reverse ? b.highestLegTrainFill! - a.highestLegTrainFill! : a.highestLegTrainFill! - b.highestLegTrainFill!;
    }
    return 0;
  });

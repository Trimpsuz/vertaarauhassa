import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { trainTypeMap, stationMap } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parse(data: any) {
  const searchJourney = data.data.searchJourney;
  const result = [];

  for (const item of searchJourney) {
    result.push({
      id: item.id,
      totalPriceCents: item.totalPrice,
      departureTime: item.departureTime,
      arrivalTime: item.arrivalTime,
      transfers: item.legs.length - 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      legs: item.legs.map((leg: any) => ({
        ...leg,
        trainTypeName: trainTypeMap.get(leg.trainType),
        arrivalStationName: stationMap.get(leg.arrivalStation),
        departureStationName: stationMap.get(leg.departureStation),
      })),
      departureStation: item.departureStation,
      arrivalStation: item.arrivalStation,
      departureStationName: stationMap.get(item.departureStation),
      arrivalStationName: stationMap.get(item.arrivalStation),
      error: item.error,
      highestLegTrainFill: item.highestLegTrainFill,
    });
  }

  return result;
}

export function getDatesInRange(startDateStr: string, endDateStr: string) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const dates = [];

  const currentDate = startDate <= endDate ? startDate : endDate;
  const lastDate = startDate <= endDate ? endDate : startDate;

  while (currentDate <= lastDate) {
    const formatted = currentDate.toISOString().split('T')[0];
    dates.push(formatted);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function formatTime(ms: number) {
  if (typeof ms !== 'number' || ms < 0) {
    return '0s';
  }

  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
}

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const inRange = (t: string, start: string, end: string) => {
  const tm = toMins(t),
    s = toMins(start),
    e = toMins(end);
  return s <= e ? tm >= s && tm <= e : tm >= s || tm <= e;
};

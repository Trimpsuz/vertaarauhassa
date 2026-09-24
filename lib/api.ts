import axios from 'axios';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getDatesInRange, parse, type JourneyOption } from './utils';

const TRPC_ENDPOINT = '/api/trpc';
const REQUEST_TIMEOUT_MS = 30_000;

let stationRequest: Promise<Station[]> | undefined;

type PassengerType = 'ADULT' | 'CHILD' | 'PENSIONER' | 'STUDENT' | 'CONSCRIPT' | 'FDFCONTRACT';

export interface Station {
  code: string;
  name: string;
}

interface StationListResult {
  stations: Record<string, { abbreviation: string; name: string }>;
}

interface JourneyPassenger {
  key: string;
  type: PassengerType;
  wheelchair: false;
  vehicles: never[];
}

interface TrpcBatchItem<T> {
  result?: {
    data: T;
  };
  error?: unknown;
}

type TrpcResponse<T> = TrpcBatchItem<T> | TrpcBatchItem<T>[];

type JourneySearchResult =
  | {
      status: 'success';
      options: JourneyOption[];
    }
  | {
      status: 'error';
      error: unknown;
    };

type CreateSalesSessionResult =
  | {
      success: true;
      data: string;
    }
  | {
      success: false;
      error: unknown;
    };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') {
    const message = error.trim();
    if (!message || message.startsWith('<') || message.length > 500) return undefined;
    return message;
  }
  if (error instanceof Error) return error.message;
  if (Array.isArray(error)) {
    for (const item of error) {
      const message = getErrorMessage(item);
      if (message) return message;
    }
    return undefined;
  }
  if (isRecord(error)) {
    if (typeof error.message === 'string') return error.message;
    if (error.error !== undefined) return getErrorMessage(error.error);
    if (error.data !== undefined) return getErrorMessage(error.data);
    if (error.json !== undefined) return getErrorMessage(error.json);
  }
  return undefined;
};

const getRequestErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const responseMessage = getErrorMessage(error.response?.data);
    if (responseMessage) return responseMessage;
    if (error.response?.status) return `VR API request failed (${error.response.status})`;
  }

  return getErrorMessage(error) || 'VR API request failed';
};

const getTrpcData = <T>(response: TrpcResponse<T>) => {
  const item = Array.isArray(response) ? response[0] : response;
  if (item?.error) throw new Error(getErrorMessage(item.error) || 'VR API request failed');
  if (!item?.result) throw new Error('VR API returned an invalid response');
  return item.result.data;
};

export const fetchStations = () => {
  stationRequest ??= (async () => {
    const response = await axios.get<TrpcResponse<StationListResult>>(`${TRPC_ENDPOINT}/station.getStations`, {
      params: {
        input: JSON.stringify({ locale: 'fi' }),
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const result = getTrpcData(response.data);
    const stations = Object.values(result.stations)
      .map((station) => ({ code: station.abbreviation, name: station.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fi'));

    if (stations.length === 0) throw new Error('VR API returned no stations');
    return stations;
  })().finally(() => {
    stationRequest = undefined;
  });

  return stationRequest;
};

const addPassengers = (passengers: JourneyPassenger[], type: PassengerType, count: number) => {
  for (let i = 0; i < count; i++) {
    passengers.push({ key: uuidv4(), type, wheelchair: false, vehicles: [] });
  }
};

export const searchJourney = async (
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  adults: number,
  children: number,
  seniors: number,
  students: number,
  conscripts: number,
  fdfContract: number,
  stationMap: ReadonlyMap<string, string>,
) => {
  const dates = getDatesInRange(startDate, endDate);
  const passengers: JourneyPassenger[] = [];

  addPassengers(passengers, 'ADULT', adults);
  addPassengers(passengers, 'CHILD', children);
  addPassengers(passengers, 'PENSIONER', seniors);
  addPassengers(passengers, 'STUDENT', students);
  addPassengers(passengers, 'CONSCRIPT', conscripts);
  addPassengers(passengers, 'FDFCONTRACT', fdfContract);

  const requests = dates.map((date) => {
    const input = {
      locale: 'fi',
      arrivalStation: destination,
      departureStation: origin,
      departureTime: date,
      passengers,
      placeTypes: ['SEAT', 'CABIN_SEAT', 'CABIN_BED'],
      filters: [],
      scope: 'ANY',
    };

    return axios.get<TrpcResponse<JourneySearchResult>>(`${TRPC_ENDPOINT}/journey.searchJourney`, {
      params: {
        batch: 1,
        input: JSON.stringify({ 0: input }),
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
  });

  const responses = await Promise.allSettled(requests);
  const results: ReturnType<typeof parse> = [];
  let firstError: unknown;

  responses.forEach((response) => {
    if (response.status === 'rejected') {
      firstError ??= response.reason;
      return;
    }

    try {
      const searchResult = getTrpcData(response.value.data);
      if (searchResult.status === 'error') {
        throw new Error(getErrorMessage(searchResult.error) || 'Journey search failed');
      }
      results.push(...parse(searchResult.options, stationMap));
    } catch (error) {
      firstError ??= error;
    }
  });

  if (firstError) toast.error(getRequestErrorMessage(firstError));

  return results;
};

export const createSalesSession = async (journeyOptionId: string) => {
  try {
    const response = await axios.post<TrpcResponse<CreateSalesSessionResult>>(`${TRPC_ENDPOINT}/sales.createNewSalesSession`, { 0: { journeyOptionId } }, {
      params: { batch: 1 },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const result = getTrpcData(response.data);

    if (!result.success) throw new Error(getErrorMessage(result.error) || 'Could not create a sales session');
    return result.data;
  } catch (error) {
    toast.error(getRequestErrorMessage(error));
    return null;
  }
};

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { fetchStations, type Station } from '@/lib/api';

const STATIONS_CACHE_KEY = 'vr-stations-fi-v1';
const STATIONS_CACHE_TTL_MS = 10 * 60 * 1000;

interface StationsCache {
  cachedAt: number;
  stations: Station[];
}

const isStation = (value: unknown): value is Station => {
  if (typeof value !== 'object' || value === null) return false;
  const station = value as Record<string, unknown>;
  return typeof station.code === 'string' && typeof station.name === 'string';
};

const readStationsCache = (): StationsCache | null => {
  try {
    const rawCache = localStorage.getItem(STATIONS_CACHE_KEY);
    if (!rawCache) return null;

    const cache = JSON.parse(rawCache) as unknown;
    if (
      typeof cache !== 'object' ||
      cache === null ||
      !('cachedAt' in cache) ||
      typeof cache.cachedAt !== 'number' ||
      !('stations' in cache) ||
      !Array.isArray(cache.stations) ||
      cache.stations.length === 0 ||
      !cache.stations.every(isStation)
    ) {
      return null;
    }

    return { cachedAt: cache.cachedAt, stations: cache.stations };
  } catch {
    return null;
  }
};

const writeStationsCache = (stations: Station[]) => {
  try {
    localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), stations } satisfies StationsCache));
  } catch {}
};

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsLoadFailed, setStationsLoadFailed] = useState(false);

  const loadStations = useCallback(async () => {
    const cached = readStationsCache();
    if (cached) {
      setStations(cached.stations);
      const cacheAge = Date.now() - cached.cachedAt;
      if (cacheAge >= 0 && cacheAge < STATIONS_CACHE_TTL_MS) {
        setStationsLoading(false);
        setStationsLoadFailed(false);
        return;
      }
    }

    setStationsLoading(true);
    setStationsLoadFailed(false);

    try {
      const fetchedStations = await fetchStations();
      setStations(fetchedStations);
      writeStationsCache(fetchedStations);
    } catch {
      if (cached) {
        toast.warning('Asemien päivitys epäonnistui. Käytetään välimuistia.');
      } else {
        setStations([]);
        setStationsLoadFailed(true);
        toast.error('Asemien lataaminen epäonnistui.');
      }
    } finally {
      setStationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  const stationMap = useMemo(() => new Map<string, string>(stations.map((station) => [station.code, station.name])), [stations]);
  const getStationName = useCallback((stationCode: string) => stationMap.get(stationCode) ?? stationCode, [stationMap]);

  return {
    stations,
    stationsLoading,
    stationMap,
    getStationName,
    stationControlsDisabled: stationsLoadFailed || (stationsLoading && stations.length === 0),
  };
}

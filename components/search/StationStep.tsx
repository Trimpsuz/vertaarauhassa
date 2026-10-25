import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Station } from '@/lib/api';
import StationPicker from './StationPicker';

interface StationStepProps {
  origin: string;
  destination: string;
  stations: Station[];
  stationsLoading: boolean;
  stationControlsDisabled: boolean;
  getStationName: (code: string) => string;
  onOriginSelect: (code: string) => void;
  onDestinationSelect: (code: string) => void;
  onNext: () => void;
}

export default function StationStep({
  origin,
  destination,
  stations,
  stationsLoading,
  stationControlsDisabled,
  getStationName,
  onOriginSelect,
  onDestinationSelect,
  onNext,
}: StationStepProps) {
  const isValid = stations.length > 0 && origin !== '' && destination !== '' && origin !== destination;
  const loading = stationsLoading && stations.length === 0;

  return (
    <>
      <StationPicker
        id="origin-label"
        label="Mistä"
        icon={MapPin}
        value={origin}
        placeholder="Valitse lähtöasema..."
        stations={stations}
        loading={loading}
        disabled={stationControlsDisabled}
        getStationName={getStationName}
        onSelect={onOriginSelect}
      />

      <StationPicker
        id="destination-label"
        label="Minne"
        icon={Navigation}
        value={destination}
        placeholder="Valitse kohdeasema..."
        stations={stations}
        loading={loading}
        disabled={stationControlsDisabled}
        getStationName={getStationName}
        onSelect={onDestinationSelect}
      />

      <Button onClick={onNext} disabled={!isValid} className="w-full py-2 sm:py-0" size="lg">
        Seuraava: Valitse hakuväli
      </Button>
    </>
  );
}

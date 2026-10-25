import FloatingControls from '@/components/FloatingControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { poppins } from '@/lib/fonts';
import type { Station } from '@/lib/api';
import type { PassengerCounts, PassengerKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import AboutFooter from './AboutFooter';
import DateStep from './DateStep';
import PassengerStep from './PassengerStep';
import StationStep from './StationStep';

const stepDescriptions = ['Valitse lähto- ja kohdeasemat', 'Valitse hakuväli', 'Valitse matkustajien määrä'];

interface SearchWizardProps {
  step: number;
  origin: string;
  destination: string;
  stations: Station[];
  stationsLoading: boolean;
  stationControlsDisabled: boolean;
  getStationName: (code: string) => string;
  onOriginSelect: (code: string) => void;
  onDestinationSelect: (code: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  passengers: PassengerCounts;
  totalPassengers: number;
  loading: boolean;
  onPassengerChange: (type: PassengerKey, delta: 1 | -1) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function SearchWizard({
  step,
  origin,
  destination,
  stations,
  stationsLoading,
  stationControlsDisabled,
  getStationName,
  onOriginSelect,
  onDestinationSelect,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  passengers,
  totalPassengers,
  loading,
  onPassengerChange,
  onNext,
  onPrevious,
}: SearchWizardProps) {
  const originName = getStationName(origin);
  const destinationName = getStationName(destination);

  return (
    <>
      <FloatingControls />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 gap-12 flex-col">
        <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className={`text-xl sm:text-2xl font-bold ${poppins.className}`}>VertaaRauhassa</CardTitle>
            <CardDescription>{stepDescriptions[step - 1] ?? ''}</CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn('w-6 sm:w-8 h-2 rounded-full', step >= s ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <StationStep
                origin={origin}
                destination={destination}
                stations={stations}
                stationsLoading={stationsLoading}
                stationControlsDisabled={stationControlsDisabled}
                getStationName={getStationName}
                onOriginSelect={onOriginSelect}
                onDestinationSelect={onDestinationSelect}
                onNext={onNext}
              />
            )}

            {step === 2 && (
              <DateStep
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                originName={originName}
                destinationName={destinationName}
                onNext={onNext}
                onPrevious={onPrevious}
              />
            )}

            {step === 3 && (
              <PassengerStep
                passengers={passengers}
                totalPassengers={totalPassengers}
                originName={originName}
                destinationName={destinationName}
                startDate={startDate}
                endDate={endDate}
                loading={loading}
                onPassengerChange={onPassengerChange}
                onNext={onNext}
                onPrevious={onPrevious}
              />
            )}
          </CardContent>
        </Card>

        <AboutFooter />
      </div>
    </>
  );
}

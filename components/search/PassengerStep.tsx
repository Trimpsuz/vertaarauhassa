import { ArrowLeft, Info, Loader2Icon, Minus, Plus, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MAX_PASSENGERS, passengerTypes, type PassengerCounts, type PassengerKey } from '@/lib/constants';
import TripSummary from './TripSummary';

interface PassengerStepProps {
  passengers: PassengerCounts;
  totalPassengers: number;
  originName: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  loading: boolean;
  onPassengerChange: (type: PassengerKey, delta: 1 | -1) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PassengerStep({
  passengers,
  totalPassengers,
  originName,
  destinationName,
  startDate,
  endDate,
  loading,
  onPassengerChange,
  onNext,
  onPrevious,
}: PassengerStepProps) {
  const isValid = totalPassengers > 0 && totalPassengers <= MAX_PASSENGERS;

  return (
    <>
      <div className="space-y-4">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Matkustajat
        </Label>

        {passengerTypes.map(({ key, label }) => {
          const count = passengers[key];

          return (
            <div key={key} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
              <div>
                <div className="font-medium text-sm">{label}</div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => onPassengerChange(key, -1)} disabled={count <= 0} className="h-8 w-8 p-0" aria-label={`${label} −`}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{count}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPassengerChange(key, 1)}
                  disabled={totalPassengers >= MAX_PASSENGERS}
                  className="h-8 w-8 p-0"
                  aria-label={`${label} +`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {totalPassengers === MAX_PASSENGERS && (
          <Alert variant="default">
            <Info />
            <AlertTitle>Voit lisätä enintään 18 matkustajaa</AlertTitle>
            <AlertDescription>
              <p>
                Yli 18 hengen matkat varataan{' '}
                <a className="underline" href="https://www.vr.fi/palvelut-junassa/palvelut-ryhmille">
                  ryhmämyynnin kautta
                </a>
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <TripSummary origin={originName} destination={destinationName} dates={{ startDate, endDate }} />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onPrevious} variant="outline" size="lg" className="flex-1 bg-transparent py-2 sm:py-0">
          <ArrowLeft className="h-4 w-4" />
          Takaisin
        </Button>
        <Button onClick={onNext} disabled={!isValid || loading} size="lg" className="flex-1 py-2 sm:py-0">
          {loading && <Loader2Icon className="animate-spin" />}
          Hae
        </Button>
      </div>
    </>
  );
}

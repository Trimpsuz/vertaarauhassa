import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TripSummary from './TripSummary';

interface DateStepProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  originName: string;
  destinationName: string;
  onNext: () => void;
  onPrevious: () => void;
}

const addToDate = (date: string, amount: number, unit: 'days' | 'months') => {
  const next = new Date(date);
  if (unit === 'days') next.setDate(next.getDate() + amount);
  else next.setMonth(next.getMonth() + amount);
  return next.toISOString().split('T')[0];
};

export default function DateStep({ startDate, endDate, onStartDateChange, onEndDateChange, originName, destinationName, onNext, onPrevious }: DateStepProps) {
  const today = new Date().toISOString().split('T')[0];
  const isValid = Boolean(startDate && endDate);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="travel-start-date" className="text-sm font-medium flex items-center gap-2" id="start-date-label">
          <Calendar className="h-4 w-4" />
          Mistä
        </Label>
        <Input
          id="travel-start-date"
          type="date"
          value={startDate}
          onChange={(e) => {
            onStartDateChange(e.target.value);
            if (!endDate || new Date(e.target.value) > new Date(endDate)) onEndDateChange(e.target.value);
          }}
          min={today}
          className="w-full"
          aria-labelledby="start-date-label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="travel-end-date" className="text-sm font-medium flex items-center gap-2" id="end-date-label">
          <Calendar className="h-4 w-4" />
          Mihin
        </Label>
        <Input
          id="travel-end-date"
          type="date"
          value={endDate}
          onChange={(e) => {
            onEndDateChange(e.target.value);
            if (startDate && new Date(e.target.value) < new Date(startDate)) onStartDateChange(e.target.value);
          }}
          min={today}
          className="w-full"
          aria-labelledby="end-date-label"
        />

        <div className="flex flex-row gap-1">
          <Button variant="outline" disabled={!endDate} onClick={() => onEndDateChange(addToDate(endDate, 1, 'days'))}>
            +1 pv
          </Button>
          <Button variant="outline" disabled={!endDate} onClick={() => onEndDateChange(addToDate(endDate, 7, 'days'))}>
            +1 vk
          </Button>
          <Button variant="outline" disabled={!endDate} onClick={() => onEndDateChange(addToDate(endDate, 1, 'months'))}>
            +1 kk
          </Button>
        </div>
      </div>

      <TripSummary origin={originName} destination={destinationName} />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onPrevious} variant="outline" size="lg" className="flex-1 bg-transparent py-2 sm:py-0">
          <ArrowLeft className="h-4 w-4" />
          Takaisin
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg" className="flex-1 py-2 sm:py-0">
          Seuraava: Matkustajien määrä
        </Button>
      </div>
    </>
  );
}

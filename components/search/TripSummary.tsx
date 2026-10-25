import { Calendar, MapPin, Navigation } from 'lucide-react';

interface TripSummaryProps {
  origin: string;
  destination: string;
  dates?: { startDate: string; endDate: string };
}

export default function TripSummary({ origin, destination, dates }: TripSummaryProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
      <h4 className="font-medium text-sm">Yhteenveto</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Mistä: {origin}
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-3 w-3" /> Minne: {destination}
        </div>
        {dates && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Milloin: {dates.startDate} – {dates.endDate}
          </div>
        )}
      </div>
    </div>
  );
}

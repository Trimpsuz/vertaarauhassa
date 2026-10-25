import { memo, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';
import { Clock, Shuffle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime, type JourneyResult } from '@/lib/utils';
import JourneyLegLinks from './JourneyLegLinks';
import OpenSaleWarningDialog from './OpenSaleWarningDialog';
import TrainFillIndicator from './TrainFillIndicator';

interface ResultCardProps {
  result: JourneyResult;
  openSale: (id: string) => void;
  showAlertModal: boolean;
  setShowAlertModal: Dispatch<SetStateAction<boolean>>;
}

const formatDate = (date: Date) =>
  date
    .toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'numeric',
      weekday: 'short',
    })
    .split(' ')
    .filter((str) => str !== 'klo')
    .join(' ');

function ResultCardComponent({ result, openSale, showAlertModal, setShowAlertModal }: ResultCardProps) {
  const [open, setOpen] = useState(false);

  const handleActivate = () => {
    if (result.error) return;
    if (showAlertModal) {
      setOpen(true);
    } else {
      openSale(result.id);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      handleActivate();
    }
  };

  const handleConfirmOpen = () => {
    openSale(result.id);
    setOpen(false);
  };

  return (
    <>
      <Card
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        role={!result.error ? 'button' : undefined}
        tabIndex={!result.error ? 0 : -1}
        aria-disabled={!!result.error}
        className={`py-4 sm:py-6 w-full ${result.error ? '' : 'cursor-pointer hover:border-[#FFFFFF30] focus:outline-none focus:ring-2 focus:ring-[#5bffa6]'}`}
      >
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-sm">
          <div className={`flex flex-col gap-1 ${result.error ? 'text-[#a0988b]' : ''}`}>
            <div className="flex flex-row items-center gap-2 font-semibold text-base sm:text-lg">
              <time dateTime={new Date(result.departureTime).toISOString()}>{formatDate(new Date(result.departureTime))}</time>
              <span>→</span>
              <time dateTime={new Date(result.arrivalTime).toISOString()}>{formatDate(new Date(result.arrivalTime))}</time>
            </div>
            <div className="flex flex-wrap items-start sm:items-center gap-2 text-sm flex-col sm:flex-row">
              <div className="flex flex-row gap-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(new Date(result.arrivalTime).getTime() - new Date(result.departureTime).getTime())}
                </div>
                <div className="flex items-center gap-1">
                  <Shuffle className="w-4 h-4" />
                  <span>{result.transfers || 'Suora'}</span>
                </div>
              </div>

              <JourneyLegLinks legs={result.legs} />
            </div>
          </div>

          <div className="ml-auto flex flex-row gap-4 items-center">
            {result.highestLegTrainFill && <TrainFillIndicator fill={result.highestLegTrainFill} />}

            {result.error ? (
              <div className="font-semibold text-base text-[#a0988b]">{result.error === 'SOLD_OUT' ? 'Loppuunmyyty' : 'Ei saatavilla'}</div>
            ) : (
              <div className="font-bold text-lg sm:text-2xl text-[#5bffa6]">{(result.totalPriceCents / 100).toFixed(2)} €</div>
            )}
          </div>
        </CardContent>
      </Card>

      <OpenSaleWarningDialog open={open} onOpenChange={setOpen} showAlertModal={showAlertModal} setShowAlertModal={setShowAlertModal} onConfirm={handleConfirmOpen} />
    </>
  );
}

const ResultCard = memo(ResultCardComponent);
ResultCard.displayName = 'ResultCard';

export default ResultCard;

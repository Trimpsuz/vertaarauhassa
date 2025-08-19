import React from 'react';
import SpaceLimited from './ui/icons/SpaceLimited';
import { formatTime } from '@/lib/utils';
import SpaceModerate from './ui/icons/SpaceModerate';
import { Clock, Shuffle } from 'lucide-react';
import SpacePlenty from './ui/icons/SpacePlenty';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent } from './ui/card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResultCardComponent = ({ result, openSale }: { result: any; openSale: (id: string) => void }) => {
  return (
    <Card
      key={result.id}
      onClick={() => {
        if (!result.error) openSale(result.id);
      }}
      className={`w-full ${result.error ? '' : 'cursor-pointer hover:border-[#FFFFFF30]'}`}
    >
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        <div className={`flex flex-col gap-1 ${result.error ? 'text-[#a0988b]' : ''}`}>
          <div className="flex flex-row items-center gap-2 font-semibold text-base sm:text-lg">
            <span>
              {new Date(result.departureTime)
                .toLocaleTimeString('fi-FI', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'numeric',
                })
                .split(' ')
                .filter((str) => str !== 'klo')
                .join(' ')}
            </span>
            <span>→</span>
            <span>
              {new Date(result.arrivalTime)
                .toLocaleTimeString('fi-FI', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'numeric',
                })
                .split(' ')
                .filter((str) => str !== 'klo')
                .join(' ')}
            </span>
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

            <span>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {result.legs.map((leg: any) => `${leg.trainTypeName} ${leg.trainType === 'LOL' ? leg.commercialLineIdentifier : leg.trainType === 'JLA' ? leg.busLineId : leg.trainNumber}`).join(' → ')}
            </span>
          </div>
        </div>

        <div className="ml-auto flex flex-row gap-4 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              {result.highestLegTrainFill &&
                (result.highestLegTrainFill > 75 ? (
                  <SpaceLimited className="w-6 h-6" />
                ) : result.highestLegTrainFill > 45 ? (
                  <SpaceModerate className="w-6 h-6" />
                ) : (
                  <SpacePlenty className="w-6 h-6" />
                ))}
            </TooltipTrigger>
            <TooltipContent>
              <p>{result.highestLegTrainFill}%</p>
            </TooltipContent>
          </Tooltip>

          {result.error ? (
            <div className="font-semibold text-base text-[#a0988b]">{result.error === 'SOLD_OUT' ? 'Loppuunmyyty' : 'Ei saatavilla'}</div>
          ) : (
            <div className="font-bold text-lg sm:text-2xl text-[#5bffa6]">{(result.totalPriceCents / 100).toFixed(2)} €</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ResultCard = React.memo(ResultCardComponent);
ResultCard.displayName = 'ResultCard';

export default ResultCard;

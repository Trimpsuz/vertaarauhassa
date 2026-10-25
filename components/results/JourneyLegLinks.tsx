import type { JourneyResult } from '@/lib/utils';

export default function JourneyLegLinks({ legs }: { legs: JourneyResult['legs'] }) {
  return (
    <div className="flex flex-row gap-1">
      {legs.map((leg, index) => (
        <div key={index} className="flex flex-row gap-1">
          {['S', 'SP', 'PYO', 'IC'].includes(leg.trainType) ? (
            <a
              href={`https://venaarauhassa.fi/train/${leg.departureTime.split('T')[0]}/${leg.trainNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
              }}
              className="underline rounded-sm focus:outline-none focus:ring-2 focus:ring-[#5bffa6]"
            >
              {leg.trainTypeName} {leg.trainType === 'LOL' ? leg.commercialLineIdentifier : leg.trainType === 'JLA' ? leg.busLineId : leg.trainNumber}
            </a>
          ) : (
            <span>
              {leg.trainTypeName} {leg.trainType === 'LOL' ? leg.commercialLineIdentifier : leg.trainType === 'JLA' ? leg.busLineId : leg.trainNumber}
            </span>
          )}
          {index < legs.length - 1 && <span>→</span>}
        </div>
      ))}
    </div>
  );
}

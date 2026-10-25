import SpaceLimited from '@/components/ui/icons/SpaceLimited';
import SpaceModerate from '@/components/ui/icons/SpaceModerate';
import SpacePlenty from '@/components/ui/icons/SpacePlenty';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function TrainFillIndicator({ fill }: { fill: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div tabIndex={0} role="button" aria-label={`${fill}% täynnä`} className="focus:outline-none focus:ring-2 focus:ring-[#5bffa6] rounded-md">
          {fill > 75 ? <SpaceLimited className="w-6 h-6" /> : fill > 45 ? <SpaceModerate className="w-6 h-6" /> : <SpacePlenty className="w-6 h-6" />}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fill}%</p>
      </TooltipContent>
    </Tooltip>
  );
}

'use client';

import { useMemo } from 'react';
import { Hourglass, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DURATION_STEP } from '@/lib/journey';
import { formatTime } from '@/lib/utils';

interface DurationFilterProps {
  bounds: [number, number];
  sliderBounds: [number, number];
  value: number[] | null;
  onChange: (value: number[] | null) => void;
}

export default function DurationFilter({ bounds, sliderBounds, value, onChange }: DurationFilterProps) {
  const durationValue = value ?? bounds;
  const toSliderValue = (minutes: number) => (minutes === bounds[0] ? sliderBounds[0] : minutes === bounds[1] ? sliderBounds[1] : minutes);
  const toDurationValue = (minutes: number) => (minutes === sliderBounds[0] ? bounds[0] : minutes === sliderBounds[1] ? bounds[1] : minutes);

  const widestLabel = useMemo(() => {
    const [min, max] = bounds;
    const [sliderMin, sliderMax] = sliderBounds;
    let widest = '';
    for (let m = sliderMin; m <= sliderMax; m += DURATION_STEP) {
      const s = formatTime((m === sliderMin ? min : m === sliderMax ? max : m) * 60000);
      if (s.length > widest.length) widest = s;
    }
    return `${widest} – ${widest}`;
  }, [sliderBounds, bounds]);

  return (
    <div className="flex flex-row flex-wrap gap-2 w-full items-center">
      <div className="flex items-center gap-1 shrink-0">
        <Hourglass className="h-4 w-4" />
        <span className="font-medium" id="duration-label">
          Kesto
        </span>
      </div>

      <div className="flex flex-row gap-2 items-center" aria-labelledby="duration-label">
        <Slider
          min={sliderBounds[0]}
          max={sliderBounds[1]}
          step={DURATION_STEP}
          minStepsBetweenThumbs={0}
          value={[toSliderValue(durationValue[0]), toSliderValue(durationValue[1])]}
          onValueChange={(next) => {
            const range = [toDurationValue(next[0]), toDurationValue(next[1])];
            onChange(range[0] === bounds[0] && range[1] === bounds[1] ? null : range);
          }}
          disabled={bounds[0] === bounds[1]}
          aria-label="Matkan kesto"
          className="w-64 cursor-pointer"
        />

        <span className="inline-grid shrink-0 tabular-nums text-sm text-center">
          <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
            {widestLabel}
          </span>
          <span className="col-start-1 row-start-1 whitespace-nowrap">
            {formatTime(durationValue[0] * 60000)} – {formatTime(durationValue[1] * 60000)}
          </span>
        </span>

        <Button size="icon" variant="outline" className="flex-none" onClick={() => onChange(null)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

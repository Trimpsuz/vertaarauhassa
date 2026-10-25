'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import JourneyResults from '@/components/results/JourneyResults';
import SearchWizard from '@/components/search/SearchWizard';
import { useJourneyFilters } from '@/hooks/useJourneyFilters';
import { useShowAlertModal } from '@/hooks/useShowAlertModal';
import { useStations } from '@/hooks/useStations';
import { searchJourney } from '@/lib/api';
import { MAX_PASSENGERS, type PassengerCounts, type PassengerKey } from '@/lib/constants';
import { parseQuery, searchQueryUpdates, updateQuery } from '@/lib/query';
import type { JourneyResult } from '@/lib/utils';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const searchParams = useSearchParams();
  const [initial] = useState(() => parseQuery(searchParams));

  const [currentStep, setCurrentStep] = useState(initial.step);
  const [origin, setOrigin] = useState(initial.origin);
  const [destination, setDestination] = useState(initial.destination);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [passengers, setPassengers] = useState<PassengerCounts>(initial.passengers);
  const [searchResults, setSearchResults] = useState<JourneyResult[]>([]);
  const [loading, setLoading] = useState(initial.step === 4);
  const [showAlertModal, setShowAlertModal] = useShowAlertModal();

  const { stations, stationsLoading, stationMap, getStationName, stationControlsDisabled } = useStations();
  const filters = useJourneyFilters(searchResults, initial.filters);
  const { setDurationRange } = filters;

  const totalPassengers = Object.values(passengers).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    updateQuery(searchQueryUpdates({ step: currentStep, origin, destination, startDate, endDate, passengers }));
  }, [currentStep, origin, destination, startDate, endDate, passengers]);

  const search = useCallback(
    async (resetDuration: boolean) => {
      setLoading(true);

      try {
        const results = await searchJourney(
          origin,
          destination,
          startDate,
          endDate,
          passengers.adults,
          passengers.children,
          passengers.seniors,
          passengers.students,
          passengers.conscripts,
          passengers.fdfContract,
          stationMap,
        );

        if (results.length === 0) {
          toast.error('Matkoja ei löytynyt', {
            description: 'Kokeile palata takaisin ja muuttaa hakuehtoja',
          });
          setCurrentStep((step) => (step === 4 ? 3 : step));
          return;
        }

        setSearchResults(results);
        if (resetDuration) setDurationRange(null);
        setCurrentStep(4);
      } finally {
        setLoading(false);
      }
    },
    [origin, destination, startDate, endDate, passengers, stationMap, setDurationRange],
  );

  const autoSearchStarted = useRef(false);
  useEffect(() => {
    if (autoSearchStarted.current || initial.step !== 4 || stationsLoading) return;
    autoSearchStarted.current = true;
    void search(false);
  }, [initial.step, stationsLoading, search]);

  const handleOriginSelect = (stationKey: string) => {
    if (stationKey === destination) {
      if (origin) setDestination(origin);
      else setDestination('');
    }

    setOrigin(stationKey === origin ? '' : stationKey);
  };

  const handleDestinationSelect = (stationKey: string) => {
    if (stationKey === origin) {
      if (origin) setOrigin(destination);
      else setOrigin('');
    }

    setDestination(stationKey === destination ? '' : stationKey);
  };

  const handlePassengerChange = (type: PassengerKey, delta: 1 | -1) => {
    setPassengers((prev) => {
      const total = Object.values(prev).reduce((sum, count) => sum + count, 0);
      if (delta > 0 && total >= MAX_PASSENGERS) return prev;
      return { ...prev, [type]: Math.max(prev[type] + delta, 0) };
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && origin && destination && origin !== destination) {
      setCurrentStep(2);
    } else if (currentStep === 2 && startDate && endDate) {
      setCurrentStep(3);
    } else if (currentStep === 3 && totalPassengers > 0 && totalPassengers <= MAX_PASSENGERS) {
      void search(true);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    if (currentStep === 4) {
      setSearchResults([]);
    }
  };

  if (searchResults.length === 0) {
    return (
      <SearchWizard
        step={Math.min(currentStep, 3)}
        origin={origin}
        destination={destination}
        stations={stations}
        stationsLoading={stationsLoading}
        stationControlsDisabled={stationControlsDisabled}
        getStationName={getStationName}
        onOriginSelect={handleOriginSelect}
        onDestinationSelect={handleDestinationSelect}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        passengers={passengers}
        totalPassengers={totalPassengers}
        loading={loading}
        onPassengerChange={handlePassengerChange}
        onNext={handleNextStep}
        onPrevious={handlePreviousStep}
      />
    );
  }

  return <JourneyResults results={searchResults} filters={filters} showAlertModal={showAlertModal} setShowAlertModal={setShowAlertModal} onBack={handlePreviousStep} />;
}

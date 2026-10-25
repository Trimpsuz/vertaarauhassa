'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import JourneyResults from '@/components/results/JourneyResults';
import SearchWizard from '@/components/search/SearchWizard';
import { useJourneyFilters } from '@/hooks/useJourneyFilters';
import { useShowAlertModal } from '@/hooks/useShowAlertModal';
import { useStations } from '@/hooks/useStations';
import { searchJourney } from '@/lib/api';
import { initialPassengers, MAX_PASSENGERS, type PassengerCounts, type PassengerKey } from '@/lib/constants';
import type { JourneyResult } from '@/lib/utils';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [passengers, setPassengers] = useState<PassengerCounts>(initialPassengers);
  const [searchResults, setSearchResults] = useState<JourneyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useShowAlertModal();

  const { stations, stationsLoading, stationMap, getStationName, stationControlsDisabled } = useStations();
  const filters = useJourneyFilters(searchResults);

  const totalPassengers = Object.values(passengers).reduce((sum, count) => sum + count, 0);

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

  const handleNextStep = async () => {
    if (currentStep === 1 && origin && destination && origin !== destination) {
      setCurrentStep(2);
    } else if (currentStep === 2 && startDate && endDate) {
      setCurrentStep(3);
    } else if (currentStep === 3 && totalPassengers > 0 && totalPassengers <= MAX_PASSENGERS) {
      setLoading(true);
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
      setLoading(false);
      if (results.length === 0) {
        toast.error('Matkoja ei löytynyt', {
          description: 'Kokeile palata takaisin ja muuttaa hakuehtoja',
        });
        return;
      }
      setSearchResults(results);
      filters.setDurationRange(null);
      setCurrentStep(4);
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
        step={currentStep}
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

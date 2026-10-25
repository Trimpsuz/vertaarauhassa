'use client';

import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import FloatingControls from '@/components/FloatingControls';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { JourneyFilters } from '@/hooks/useJourneyFilters';
import { createSalesSession } from '@/lib/api';
import { poppins } from '@/lib/fonts';
import type { JourneyResult } from '@/lib/utils';
import ResultCard from './ResultCard';
import ResultsFilters from './ResultsFilters';

interface JourneyResultsProps {
  results: JourneyResult[];
  filters: JourneyFilters;
  showAlertModal: boolean;
  setShowAlertModal: Dispatch<SetStateAction<boolean>>;
  onBack: () => void;
}

export default function JourneyResults({ results, filters, showAlertModal, setShowAlertModal, onBack }: JourneyResultsProps) {
  const createdSales = useRef(new Map<string, string>());

  const openSale = useCallback(async (id: string) => {
    let saleId = createdSales.current.get(id);
    if (saleId) {
      window.open(`https://www.vr.fi/logout?locale=fi&returnTo=%2Fkertalippu-menomatkan-tiedot%3FsaleId%3D${saleId}&initLogout=true`, '_blank');
      return;
    }

    const newSaleId = await createSalesSession(id);
    if (!newSaleId) return;

    saleId = newSaleId;
    createdSales.current.set(id, saleId);

    window.open(`https://www.vr.fi/logout?locale=fi&returnTo=%2Fkertalippu-menomatkan-tiedot%3FsaleId%3D${saleId}&initLogout=true`, '_blank');
  }, []);

  return (
    <>
      <FloatingControls showScroll={true} />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 flex-col gap-6">
        <h1 className={`text-xl sm:text-2xl font-bold text-center ${poppins.className}`}>
          {results[0].departureStationName} – {results[0].arrivalStationName}
        </h1>

        <ResultsFilters filters={filters} />

        <div className="flex flex-col gap-2 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
          {filters.filteredResults.length === 0 && (
            <Alert variant="default">
              <Info />
              <AlertTitle>Matkoja ei löytynyt</AlertTitle>
              <AlertDescription>
                <p>Kokeile muuttaa rajausehtoja</p>
              </AlertDescription>
            </Alert>
          )}
          {filters.sortedResults.map((result) => (
            <div key={result.id} hidden={!filters.visibleResultIds.has(result.id)}>
              <ResultCard result={result} openSale={openSale} showAlertModal={showAlertModal} setShowAlertModal={setShowAlertModal} />
            </div>
          ))}
        </div>

        <div className="flex flex-row w-full max-w-md sm:max-w-xl justify-center">
          <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin
          </Button>
        </div>
      </div>
    </>
  );
}

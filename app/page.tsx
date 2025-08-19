'use client';

import FloatingControls from '@/components/FloatingControls';
import ResultCard from '@/components/ResultCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { createSale, searchJourney } from '@/lib/api';
import { stationMap } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowUpDown, Calendar, Check, ChevronDown, ChevronsUpDown, Info, Loader2Icon, MapPin, Minus, Navigation, Plus, Shuffle, TrainFront, Users } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['800'],
});

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [originOpen, setOriginOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [students, setStudents] = useState(0);
  const [conscripts, setConscripts] = useState(0);
  const [changeCount, setChangeCount] = useState('any');
  const [allowPendolino, setAllowPendolino] = useState(true);
  const [allowInterCity, setAllowInterCity] = useState(true);
  const [allowBus, setAllowBus] = useState(true);
  const [allowNight, setAllowNight] = useState(true);
  const [allowCommuter, setAllowCommuter] = useState(true);
  const [allowRailCar, setAllowRailCar] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any>([]);
  const [sort, setSort] = useState('startTime');
  const [reverse, setReverse] = useState(false);
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [loading, setLoading] = useState(false);

  const sortOptions = ['startTime', 'endTime', 'duration', 'price', 'transfers', 'fill'];
  const sortOptionNames = new Map<string, string>([
    ['startTime', 'Lähtöaika'],
    ['endTime', 'Saapumisaika'],
    ['duration', 'Kesto'],
    ['price', 'Hinta'],
    ['transfers', 'Vaihtojen määrä'],
    ['fill', 'Täyttöaste'],
  ]);

  const filteredSearchResults = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return searchResults.filter((result: any) => {
      const legs = result.legs ?? [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isPendolino = legs.some((leg: any) => leg.trainType === 'S');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isInterCity = legs.some((leg: any) => leg.trainType === 'IC');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isBus = legs.some((leg: any) => ['JLA', 'BLV'].includes(leg.trainType));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isNight = legs.some((leg: any) => leg.trainType === 'PYO');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isCommuter = legs.some((leg: any) => leg.trainType === 'LOL');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isRailCar = legs.some((leg: any) => leg.trainType === 'HDM');

      const matchesType =
        (!isPendolino || allowPendolino) && (!isInterCity || allowInterCity) && (!isBus || allowBus) && (!isNight || allowNight) && (!isCommuter || allowCommuter) && (!isRailCar || allowRailCar);

      const matchesTransfers = changeCount === 'any' || (changeCount === 'direct' && result.transfers === 0) || (!['any', 'direct'].includes(changeCount) && result.transfers <= Number(changeCount));

      const soldOut = hideSoldOut && result.error === 'SOLD_OUT';

      return matchesType && matchesTransfers && !soldOut;
    });
  }, [searchResults, allowPendolino, allowInterCity, allowBus, allowNight, allowCommuter, allowRailCar, changeCount, hideSoldOut]);

  const sortedFilteredSearchResults = useMemo(() => {
    return [...filteredSearchResults].sort((a, b) => {
      if (sort === 'startTime') {
        return reverse ? new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime() : new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      }
      if (sort === 'endTime') {
        return reverse ? new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime() : new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
      }
      if (sort === 'duration') {
        const durA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime();
        const durB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime();
        return reverse ? durB - durA : durA - durB;
      }
      if (sort === 'price') {
        return reverse ? b.totalPriceCents - a.totalPriceCents : a.totalPriceCents - b.totalPriceCents;
      }
      if (sort === 'transfers') {
        return reverse ? b.transfers - a.transfers : a.transfers - b.transfers;
      }
      if (sort === 'fill') {
        return reverse ? b.highestLegTrainFill - a.highestLegTrainFill : a.highestLegTrainFill - b.highestLegTrainFill;
      }
      return 0;
    });
  }, [filteredSearchResults, sort, reverse]);

  const createdSales = new Map<string, string>();

  const stations = Array.from(stationMap.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  const openSale = async (id: string) => {
    let saleId = createdSales.get(id);
    if (saleId) {
      window.open(`https://www.vr.fi/kertalippu-menomatkan-tiedot?saleId=${saleId}`, '_blank');
      return;
    }

    const res = await createSale(id);
    if (res.errors) {
      toast(res.errors[0].message);
      return;
    }

    saleId = res.data.createNewSale.id;
    createdSales.set(id, saleId!);

    window.open(`https://www.vr.fi/kertalippu-menomatkan-tiedot?saleId=${saleId}`, '_blank');
  };

  const handleOriginSelect = (stationKey: string) => {
    setOrigin(stationKey === origin ? '' : stationKey);
    setOriginOpen(false);
  };

  const handleDestinationSelect = (stationKey: string) => {
    setDestination(stationKey === destination ? '' : stationKey);
    setDestinationOpen(false);
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && origin && destination && origin !== destination) {
      setCurrentStep(2);
    } else if (currentStep === 2 && startDate && endDate) {
      setCurrentStep(3);
    } else if (currentStep === 3 && 19 > adults + children + seniors + students + conscripts && adults + children + seniors + students + conscripts > 0) {
      setLoading(true);
      const results = await searchJourney(origin, destination, startDate, endDate, adults, children, seniors, students, conscripts);
      setLoading(false);
      if (results.length === 0) {
        toast.error('Matkoja ei löytynyt', {
          description: 'Kokeile palata takaisin ja muuttaa hakuehtoja',
        });
        return;
      }
      setSearchResults(results);
      setCurrentStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    if (currentStep === 4) {
      setSearchResults([]);
      createdSales.clear();
    }
  };

  const incrementPassenger = (type: 'adults' | 'children' | 'seniors' | 'students' | 'conscripts') => {
    if (type === 'adults') setAdults((prev) => Math.min(prev + 1, 18 - (children + seniors + students + conscripts)));
    if (type === 'children') setChildren((prev) => Math.min(prev + 1, 18 - (adults + seniors + students + conscripts)));
    if (type === 'seniors') setSeniors((prev) => Math.min(prev + 1, 18 - (children + adults + students + conscripts)));
    if (type === 'students') setStudents((prev) => Math.min(prev + 1, 18 - (children + adults + seniors + conscripts)));
    if (type === 'conscripts') setConscripts((prev) => Math.min(prev + 1, 18 - (children + adults + students + seniors)));
  };

  const decrementPassenger = (type: 'adults' | 'children' | 'seniors' | 'students' | 'conscripts') => {
    if (type === 'adults') setAdults((prev) => Math.max(prev - 1, 0));
    if (type === 'children') setChildren((prev) => Math.max(prev - 1, 0));
    if (type === 'seniors') setSeniors((prev) => Math.max(prev - 1, 0));
    if (type === 'students') setStudents((prev) => Math.max(prev - 1, 0));
    if (type === 'conscripts') setConscripts((prev) => Math.max(prev - 1, 0));
  };

  const isStep1Valid = origin && destination && origin !== destination;
  const isStep2Valid = startDate && endDate;
  const isStep3Valid = 19 > adults + children + seniors + students + conscripts && adults + children + seniors + students + conscripts > 0;

  const today = new Date().toISOString().split('T')[0];

  if (searchResults.length === 0) {
    return (
      <>
        <FloatingControls />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 gap-12 flex-col">
          <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className={`text-xl sm:text-2xl font-bold ${poppins.className}`}>VertaaRauhassa</CardTitle>
              <CardDescription>{currentStep === 1 ? 'Valitse lähto- ja kohdeasemat' : currentStep === 2 ? 'Valitse hakuväli' : currentStep === 3 ? 'Valitse matkustajien määrä' : ''}</CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                <div className={cn('w-6 sm:w-8 h-2 rounded-full', currentStep >= 1 ? 'bg-primary' : 'bg-muted')} />
                <div className={cn('w-6 sm:w-8 h-2 rounded-full', currentStep >= 2 ? 'bg-primary' : 'bg-muted')} />
                <div className={cn('w-6 sm:w-8 h-2 rounded-full', currentStep >= 3 ? 'bg-primary' : 'bg-muted')} />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2" id="origin-label">
                      <MapPin className="h-4 w-4" />
                      Mistä
                    </label>
                    <Popover open={originOpen} onOpenChange={setOriginOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-labelledby="origin-label" aria-expanded={originOpen} className="w-full justify-between bg-transparent">
                          {origin ? stationMap.get(origin) : 'Valitse lähtöasema...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full sm:min-w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Hae..." />
                          <CommandList>
                            <CommandEmpty>Asemia ei lötynyt.</CommandEmpty>
                            <CommandGroup>
                              {stations
                                .filter((station) => station.key !== destination)
                                .map((station) => (
                                  <CommandItem key={station.key} value={station.value} onSelect={() => handleOriginSelect(station.key)}>
                                    <Check className={cn('mr-2 h-4 w-4', origin === station.key ? 'opacity-100' : 'opacity-0')} />
                                    {station.value}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2" id="destination-label">
                      <Navigation className="h-4 w-4" />
                      Minne
                    </label>
                    <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-labelledby="destination-label" aria-expanded={destinationOpen} className="w-full justify-between bg-transparent">
                          {destination ? stationMap.get(destination) : 'Valitse kohdeasema...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full sm:min-w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Hae..." />
                          <CommandList>
                            <CommandEmpty>Asemia ei lötynyt.</CommandEmpty>
                            <CommandGroup>
                              {stations
                                .filter((station) => station.key !== origin)
                                .map((station) => (
                                  <CommandItem key={station.key} value={station.value} onSelect={() => handleDestinationSelect(station.key)}>
                                    <Check className={cn('mr-2 h-4 w-4', destination === station.key ? 'opacity-100' : 'opacity-0')} />
                                    {station.value}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button onClick={handleNextStep} disabled={!isStep1Valid} className="w-full py-2 sm:py-0" size="lg">
                    Seuraava: Valitse hakuväli
                  </Button>
                </>
              )}

              {currentStep === 2 && (
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
                        setStartDate(e.target.value);
                        if (!endDate || new Date(e.target.value) > new Date(endDate)) setEndDate(e.target.value);
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
                        setEndDate(e.target.value);
                        if (startDate && new Date(e.target.value) < new Date(startDate)) setStartDate(e.target.value);
                      }}
                      min={today}
                      className="w-full"
                      aria-labelledby="end-date-label"
                    />

                    <div className="flex flex-row gap-1">
                      <Button
                        variant="outline"
                        disabled={!endDate}
                        onClick={() => {
                          setEndDate(new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)).toISOString().split('T')[0]);
                        }}
                      >
                        +1 pv
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!endDate}
                        onClick={() => {
                          setEndDate(new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 7)).toISOString().split('T')[0]);
                        }}
                      >
                        +1 vk
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!endDate}
                        onClick={() => {
                          setEndDate(new Date(new Date(endDate).setMonth(new Date(endDate).getMonth() + 1)).toISOString().split('T')[0]);
                        }}
                      >
                        +1 kk
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Yhteenveto</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Mistä: {stationMap.get(origin)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-3 w-3" /> Minne: {stationMap.get(destination)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handlePreviousStep} variant="outline" size="lg" className="flex-1 bg-transparent py-2 sm:py-0">
                      <ArrowLeft className="h-4 w-4" />
                      Takaisin
                    </Button>
                    <Button onClick={handleNextStep} disabled={!isStep2Valid} size="lg" className="flex-1 py-2 sm:py-0">
                      Seuraava: Matkustajien määrä
                    </Button>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div className="space-y-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Matkustajat
                    </Label>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium text-sm">Aikuiset</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => decrementPassenger('adults')} disabled={adults <= 0} className="h-8 w-8 p-0" aria-label="Aikuiset −">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{adults}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementPassenger('adults')}
                          disabled={adults >= 18 - (children + seniors + students + conscripts)}
                          className="h-8 w-8 p-0"
                          aria-label="Aikuiset +"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium text-sm">Lapset</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => decrementPassenger('children')} disabled={children <= 0} className="h-8 w-8 p-0" aria-label="Lapset −">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{children}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementPassenger('children')}
                          disabled={children >= 18 - (adults + seniors + students + conscripts)}
                          className="h-8 w-8 p-0"
                          aria-label="Lapset +"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium text-sm">Eläkeläiset</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => decrementPassenger('seniors')} disabled={seniors <= 0} className="h-8 w-8 p-0" aria-label="Eläkeläiset −">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{seniors}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementPassenger('seniors')}
                          disabled={seniors >= 18 - (children + adults + students + conscripts)}
                          className="h-8 w-8 p-0"
                          aria-label="Eläkeläiset +"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium text-sm">Opiskelijat</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => decrementPassenger('students')} disabled={students <= 0} className="h-8 w-8 p-0" aria-label="Opiskelijat −">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{students}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementPassenger('students')}
                          disabled={students >= 18 - (children + seniors + adults + conscripts)}
                          className="h-8 w-8 p-0"
                          aria-label="Opiskelijat +"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium text-sm">Asevelvolliset</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => decrementPassenger('conscripts')} disabled={conscripts <= 0} className="h-8 w-8 p-0" aria-label="Asevelvolliset −">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{conscripts}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementPassenger('conscripts')}
                          disabled={conscripts >= 18 - (children + seniors + students + adults)}
                          className="h-8 w-8 p-0"
                          aria-label="Asevelvolliset +"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {adults + children + seniors + students + conscripts == 18 && (
                      <Alert variant="default">
                        <Info />
                        <AlertTitle>Voit lisätä enintään 18 matkustajaa</AlertTitle>
                        <AlertDescription>
                          <p>
                            Yli 18 hengen matkat varataan{' '}
                            <a className="underline" href="https://www.vr.fi/palvelut-junassa/palvelut-ryhmille">
                              ryhmämyynnin kautta
                            </a>
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Yhteenveto</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Mistä: {stationMap.get(origin)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-3 w-3" /> Minne: {stationMap.get(destination)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Milloin: {startDate} - {endDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handlePreviousStep} variant="outline" size="lg" className="flex-1 bg-transparent py-2 sm:py-0">
                      <ArrowLeft className="h-4 w-4" />
                      Takaisin
                    </Button>
                    <Button onClick={handleNextStep} disabled={!isStep3Valid || loading} size="lg" className="flex-1 py-2 sm:py-0">
                      {loading && <Loader2Icon className="animate-spin" />}
                      Hae
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-md text-muted-foreground">
              Tämä on{' '}
              <a className="underline cursor-pointer" href="https://github.com/Trimpsuz/vertaarauhassa">
                avoimen lähdekoodin
              </a>{' '}
              projekti
            </p>

            <div>
              <p className="text-sm text-muted-foreground">VertaaRauhassa {process.env.NEXT_PUBLIC_APP_VERSION}</p>
              <p className="text-sm text-muted-foreground">
                Emme ole <span className="italic">VR-Yhtymä Oyj:n</span>, sen tytäryhtiöiden tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla virallisesti yhteydessä niihin.
                Virallinen verkkosivusto on osoitteessa{' '}
                <a className="underline cursor-pointer" href="https://www.vr.fi/">
                  www.vr.fi
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <FloatingControls showScroll={true} />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 flex-col gap-6">
          <h1 className={`text-xl sm:text-2xl font-bold text-center ${poppins.className}`}>
            {searchResults[0].departureStationName} - {searchResults[0].arrivalStationName}
          </h1>

          <div className="flex flex-col gap-3 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1">
                <Shuffle className="h-4 w-4" />
                <span className="font-medium" id="transfers-label">
                  Vaihdot
                </span>
              </div>
              <RadioGroup className="flex flex-wrap sm:flex-nowrap gap-2" value={changeCount} onValueChange={setChangeCount} defaultValue="any" aria-labelledby="transfers-label">
                {[
                  { value: 'any', label: 'Kaikki' },
                  { value: 'direct', label: 'Vain suorat' },
                  { value: '1', label: 'Yksi tai vähemmän' },
                  { value: '2', label: 'Kaksi tai vähemmän' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-1">
                    <RadioGroupItem className="cursor-pointer" value={opt.value} id={`option-${opt.value}`} />
                    <Label className="cursor-pointer" htmlFor={`option-${opt.value}`}>
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1">
                <TrainFront className="h-4 w-4" />
                <span className="font-medium" id="train-types-label">
                  Junatyypit
                </span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2" aria-labelledby="train-types-label">
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowPendolino} onCheckedChange={setAllowPendolino} aria-labelledby="pendolino-label" />
                  <Label id="pendolino-label">Pendolino</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowInterCity} onCheckedChange={setAllowInterCity} aria-labelledby="intercity-label" />
                  <Label id="intercity-label">InterCity</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowNight} onCheckedChange={setAllowNight} aria-labelledby="night-label" />
                  <Label id="night-label">Yöjuna</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowCommuter} onCheckedChange={setAllowCommuter} aria-labelledby="commuter-label" />
                  <Label id="commuter-label">Lähijuna</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowBus} onCheckedChange={setAllowBus} aria-labelledby="bus-label" />
                  <Label id="bus-label">Ratatyöbussi</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch className="cursor-pointer" checked={allowRailCar} onCheckedChange={setAllowRailCar} aria-labelledby="railcar-label" />
                  <Label id="railcar-label">Kiskobussi</Label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
              <div className="flex flex-row gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      Lajittele: {sortOptionNames.get(sort)}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {sortOptions.map((option) => (
                      <DropdownMenuItem key={option} onClick={() => setSort(option)} className={`cursor-pointer ${sort === option ? 'bg-muted' : ''}`}>
                        {sortOptionNames.get(option)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant={reverse ? 'default' : 'outline'} size="icon" onClick={() => setReverse((prev) => !prev)} aria-label="Vaihda järjestys">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-1">
                <Switch className="cursor-pointer" checked={hideSoldOut} onCheckedChange={setHideSoldOut} aria-labelledby="sold-out-label" />
                <Label id="sold-out-label">Piilota loppuunmyydyt</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
            {sortedFilteredSearchResults.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sortedFilteredSearchResults.map((result: any) => <ResultCard key={result.id} result={result} openSale={openSale} />)
            ) : (
              <Alert variant="default">
                <Info />
                <AlertTitle>Matkoja ei löytynyt</AlertTitle>
                <AlertDescription>
                  <p>Kokeile muuttaa rajausehtoja</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-row w-full max-w-md sm:max-w-xl justify-center">
            <Button onClick={handlePreviousStep} variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takaisin
            </Button>
          </div>
        </div>
      </>
    );
  }
}

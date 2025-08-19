'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, MapPin, Navigation, Calendar, ArrowLeft, Users, Minus, Plus, Info, Shuffle, TrainFront, Clock, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { stationMap } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { createSale, searchJourney } from '@/lib/api';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SpaceLimited from '@/components/ui/icons/SpaceLimited';
import SpaceModerate from '@/components/ui/icons/SpaceModerate';
import SpacePlenty from '@/components/ui/icons/SpacePlenty';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Poppins } from 'next/font/google';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredSearchResults, setFilteredSearchResults] = useState<any>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sortedFilteredSearchResults, setSortedFilteredSearchResults] = useState<any>([]);
  const [sort, setSort] = useState('startTime');
  const [reverse, setReverse] = useState(false);
  const [hideSoldOut, setHideSoldOut] = useState(false);

  const sortOptions = ['startTime', 'endTime', 'duration', 'price', 'transfers', 'fill'];
  const sortOptionNames = new Map<string, string>([
    ['startTime', 'Lähtöaika'],
    ['endTime', 'Saapumisaika'],
    ['duration', 'Kesto'],
    ['price', 'Hinta'],
    ['transfers', 'Vaihtojen määrä'],
    ['fill', 'Täyttöaste'],
  ]);

  useEffect(() => {
    const filterSearchResults = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return searchResults.filter((result: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isPendolino = result.legs.some((leg: any) => leg.trainType === 'S');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isInterCity = result.legs.some((leg: any) => leg.trainType === 'IC');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isBus = result.legs.some((leg: any) => leg.trainType === 'JLA' || leg.trainType === 'BLV');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isNight = result.legs.some((leg: any) => leg.trainType === 'PYO');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isCommuter = result.legs.some((leg: any) => leg.trainType === 'LOL');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isRailCar = result.legs.some((leg: any) => leg.trainType === 'HDM');

        const matchesType =
          (!isPendolino || allowPendolino) && (!isInterCity || allowInterCity) && (!isBus || allowBus) && (!isNight || allowNight) && (!isCommuter || allowCommuter) && (!isRailCar || allowRailCar);

        const matchesTransfers = changeCount === 'any' || (changeCount === 'direct' && result.transfers === 0) || (!['any', 'direct'].includes(changeCount) && result.transfers <= Number(changeCount));

        const soldOut = hideSoldOut && result.error === 'SOLD_OUT';

        return matchesType && matchesTransfers && !soldOut;
      });
    };

    setFilteredSearchResults(filterSearchResults);
  }, [searchResults, allowPendolino, allowInterCity, allowBus, allowNight, allowCommuter, allowRailCar, changeCount, hideSoldOut]);

  useEffect(() => {
    const sorted = [...filteredSearchResults].sort((a, b) => {
      if (sort === 'startTime') {
        return reverse ? new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime() : new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      } else if (sort === 'endTime') {
        return reverse ? new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime() : new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
      } else if (sort === 'duration') {
        return reverse
          ? new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime() - (new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime())
          : new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime() - (new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime());
      } else if (sort === 'price') {
        return reverse ? b.totalPriceCents - a.totalPriceCents : a.totalPriceCents - b.totalPriceCents;
      } else if (sort === 'transfers') {
        return reverse ? b.transfers - a.transfers : a.transfers - b.transfers;
      } else if (sort === 'fill') {
        return reverse ? b.highestLegTrainFill - a.highestLegTrainFill : a.highestLegTrainFill - b.highestLegTrainFill;
      }
      return 0;
    });

    setSortedFilteredSearchResults(sorted);
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
      const results = await searchJourney(origin, destination, startDate, endDate, adults, children, seniors, students, conscripts);
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
      setFilteredSearchResults([]);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className={`text-xl sm:text-2xl font-bold ${poppins.className}`}>VertaaRauhassa</CardTitle>
            <CardDescription>{currentStep === 1 ? 'Valitse lähto- ja kohdeasemat' : currentStep === 2 ? 'Valitse hakuväli' : currentStep === 3 ? 'Matkustajien määrä' : ''}</CardDescription>
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
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Mistä
                  </label>
                  <Popover open={originOpen} onOpenChange={setOriginOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={originOpen} className="w-full justify-between bg-transparent">
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
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Minne
                  </label>
                  <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={destinationOpen} className="w-full justify-between bg-transparent">
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

                <Button onClick={handleNextStep} disabled={!isStep1Valid} className="w-full py-2" size="lg">
                  Seuraava: Valitse hakuväli
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="travel-date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mistä
                  </Label>
                  <Input id="travel-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={today} className="w-full" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travel-date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mihin
                  </Label>
                  <Input id="travel-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={today} className="w-full" />
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
                  <Button onClick={handlePreviousStep} variant="outline" className="flex-1 bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Takaisin
                  </Button>
                  <Button onClick={handleNextStep} disabled={!isStep2Valid} className="flex-1 py-2" size="lg">
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
                      <Button variant="outline" size="sm" onClick={() => decrementPassenger('adults')} disabled={adults <= 0} className="h-8 w-8 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{adults}</span>
                      <Button variant="outline" size="sm" onClick={() => incrementPassenger('adults')} disabled={adults >= 18 - (children + seniors + students + conscripts)} className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                    <div>
                      <div className="font-medium text-sm">Lapset</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => decrementPassenger('children')} disabled={children <= 0} className="h-8 w-8 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{children}</span>
                      <Button variant="outline" size="sm" onClick={() => incrementPassenger('children')} disabled={children >= 18 - (adults + seniors + students + conscripts)} className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                    <div>
                      <div className="font-medium text-sm">Eläkeläiset</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => decrementPassenger('seniors')} disabled={seniors <= 0} className="h-8 w-8 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{seniors}</span>
                      <Button variant="outline" size="sm" onClick={() => incrementPassenger('seniors')} disabled={seniors >= 18 - (children + adults + students + conscripts)} className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                    <div>
                      <div className="font-medium text-sm">Opiskelijat</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => decrementPassenger('students')} disabled={students <= 0} className="h-8 w-8 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{students}</span>
                      <Button variant="outline" size="sm" onClick={() => incrementPassenger('students')} disabled={students >= 18 - (children + seniors + adults + conscripts)} className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border rounded-lg gap-2">
                    <div>
                      <div className="font-medium text-sm">Asevelvolliset</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => decrementPassenger('conscripts')} disabled={conscripts <= 0} className="h-8 w-8 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{conscripts}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => incrementPassenger('conscripts')}
                        disabled={conscripts >= 18 - (children + seniors + students + adults)}
                        className="h-8 w-8 p-0"
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
                  <Button onClick={handlePreviousStep} variant="outline" className="flex-1 bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Takaisin
                  </Button>
                  <Button onClick={handleNextStep} disabled={!isStep3Valid} className="flex-1 py-2" size="lg">
                    Hae
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 flex-col gap-6">
        <h1 className={`text-xl sm:text-2xl font-bold text-center ${poppins.className}`}>
          {searchResults[0].departureStationName} - {searchResults[0].arrivalStationName}
        </h1>

        <div className="flex flex-col gap-3 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              <span className="font-medium">Vaihdot</span>
            </div>
            <RadioGroup className="flex flex-wrap sm:flex-nowrap gap-2" value={changeCount} onValueChange={setChangeCount} defaultValue="any">
              {[
                { value: 'any', label: 'Kaikki' },
                { value: 'direct', label: 'Vain suorat' },
                { value: '1', label: 'Yksi tai vähemmän' },
                { value: '2', label: 'Kaksi tai vähemmän' },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-1 cursor-pointer">
                  <RadioGroupItem value={opt.value} id={`option-${opt.value}`} />
                  <Label htmlFor={`option-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-1">
              <Switch checked={allowPendolino} onCheckedChange={setAllowPendolino} />
              <Label>Pendolino</Label>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={allowInterCity} onCheckedChange={setAllowInterCity} />
              <Label>InterCity</Label>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={allowNight} onCheckedChange={setAllowNight} />
              <Label>Yöjuna</Label>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={allowCommuter} onCheckedChange={setAllowCommuter} />
              <Label>Lähijuna</Label>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={allowBus} onCheckedChange={setAllowBus} />
              <Label>Ratatyöbussi</Label>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={allowRailCar} onCheckedChange={setAllowRailCar} />
              <Label>Kiskobussi</Label>
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

              <Button variant={reverse ? 'default' : 'outline'} size="icon" onClick={() => setReverse((prev) => !prev)}>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Switch checked={hideSoldOut} onCheckedChange={setHideSoldOut} />
              <Label>Piilota loppuunmyydyt</Label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
          {sortedFilteredSearchResults.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sortedFilteredSearchResults.map((result: any) => (
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
                        {result.legs
                          .map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (leg: any) => `${leg.trainTypeName} ${leg.trainType === 'LOL' ? leg.commercialLineIdentifier : leg.trainType === 'JLA' ? leg.busLineId : leg.trainNumber}`
                          )
                          .join(' → ')}
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
            ))
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
    );
  }
}

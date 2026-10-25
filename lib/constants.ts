export const trainTypeMap = new Map<string, string>([
  ['IC', 'InterCity'],
  ['LOL', 'Lähijuna'],
  ['PYO', 'Yöjuna'],
  ['S', 'Pendolino'],
  ['SP', 'Pendolino Plus'],
  ['JLA', 'Ratatyöbussi'],
  ['BLV', 'Ratatyöbussi'],
  ['HDM', 'Kiskobussi'],
]);

export const weekdays = [
  { label: 'Su', value: 0 },
  { label: 'Ma', value: 1 },
  { label: 'Ti', value: 2 },
  { label: 'Ke', value: 3 },
  { label: 'To', value: 4 },
  { label: 'Pe', value: 5 },
  { label: 'La', value: 6 },
];

export const allWeekdays = [0, 1, 2, 3, 4, 5, 6];

export const passengerTypes = [
  { key: 'adults', label: 'Aikuiset' },
  { key: 'children', label: 'Lapset' },
  { key: 'seniors', label: 'Eläkeläiset' },
  { key: 'students', label: 'Opiskelijat' },
  { key: 'conscripts', label: 'Asevelvolliset' },
  { key: 'fdfContract', label: 'Asevelvolliset, palvelusmatka' },
] as const;

export type PassengerKey = (typeof passengerTypes)[number]['key'];
export type PassengerCounts = Record<PassengerKey, number>;

export const initialPassengers: PassengerCounts = {
  adults: 1,
  children: 0,
  seniors: 0,
  students: 0,
  conscripts: 0,
  fdfContract: 0,
};

export const MAX_PASSENGERS = 18;

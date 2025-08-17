import { getDatesInRange, parse } from './utils';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const searchJourney = async (
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  adults: number,
  children: number,
  seniors: number,
  students: number,
  conscripts: number
) => {
  const dates = getDatesInRange(startDate, endDate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passengers: any[] = [];

  for (let i = 0; i < adults; i++) {
    passengers.push({ key: uuidv4(), type: 'ADULT', wheelchair: false, vehicles: [] });
  }
  for (let i = 0; i < children; i++) {
    passengers.push({ key: uuidv4(), type: 'CHILD', wheelchair: false, vehicles: [] });
  }
  for (let i = 0; i < seniors; i++) {
    passengers.push({ key: uuidv4(), type: 'PENSIONER', wheelchair: false, vehicles: [] });
  }
  for (let i = 0; i < students; i++) {
    passengers.push({ key: uuidv4(), type: 'STUDENT', wheelchair: false, vehicles: [] });
  }
  for (let i = 0; i < conscripts; i++) {
    passengers.push({ key: uuidv4(), type: 'CONSCRIPT', wheelchair: false, vehicles: [] });
  }

  const requests = dates.map((date) =>
    axios.post('/api/v7', {
      operationName: 'searchJourney',
      variables: {
        filters: [],
        arrivalStation: destination,
        departureStation: origin,
        departureDateTime: date,
        passengers: passengers,
        placeTypes: ['SEAT', 'CABIN_BED'],
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '137b82599f60fe662143194950e3a49469822bdddea4c1e360948cb979e946bd',
        },
      },
    })
  );

  const responses = await Promise.all(requests);
  const results = responses.flatMap((res) => parse(res.data));

  return results;
};

export const createSale = async (id: string) => {
  const response = (
    await axios.post('/api/v7', {
      operationName: 'createNewSale',
      variables: { journeyOptionId: id },
      extensions: { persistedQuery: { version: 1, sha256Hash: 'c6588f738f893106699499fe77e313f7e1a5d960f44cce9aa8fc5ec6a00d9a30' } },
    })
  ).data;

  return response;
};

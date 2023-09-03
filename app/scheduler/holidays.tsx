import fs from 'fs/promises';
import Promise from 'bluebird';
import * as R from 'ramda';
import { HolidayAPI } from 'holidayapi';
import { parseISO, format } from './date.js';

const holidayAPI = new HolidayAPI({ key: process.env.HOLIDAY_API_KEY });

const compact = R.filter(R.identity);

const translateObserved = h => 
  h.date !== h.observed
    ? { ...h, name: `${h.name} (observed)`, date: parseISO(h.observed) }
    : { ...h, date: parseISO(h.date) };

const augment = (countries, holidays) => {
  countries.forEach(country => {
    if (HOLIDAYS[country] !== undefined) {
      holidays = holidays.filter(h => h.country !== country).concat(HOLIDAYS[country].map(h => ({ ...h, country })));
    };
  });
  return holidays;
};

const getHolidays = async (countries, date) => {
  const id = [ countries.join(','), format(date) ].join(':');
  
  const month = date.getUTCMonth(), year = date.getUTCFullYear();

  const holidays = R.flatten(compact(countries.map(country => {
    const holidays = R.find(h => h.country === country, data).holidays;
    return R.find(h => {
      const d = parseISO(h.date);
      return h.country === country && d.getUTCMonth() === month && d.getUTCFullYear() === year;
    }, holidays);
  })));

  return cache(id, augment(countries, holidays.map(translateObserved)));
};

export const populateHolidays = async () => {
  const file = `data/holidays.json`;

  try {
    const cached = await fs.readFile(file, 'utf8');
    if (cached !== undefined) return JSON.parse(cached);
  }
  catch(err) {
    // no file
    console.log('Populating holidays');
  }

  const response = await holidayAPI.countries();
    
  if (response.countries.length === 0) console.log('Error');

  const countries = response.countries;

  const holidays = await Promise.map(countries, async country => {
    const code = country.code;

    return { country: code, holidays: [ 
      ...(await holidayAPI.holidays({ country: code, year: 2024, public: true })).holidays, 
      ...(await holidayAPI.holidays({ country: code, year: 2025, public: true })).holidays, 
      ] 
    };
  });

  await fs.writeFile(file, JSON.stringify({ holidays, countries }), 'utf8');

  return holidays;
};

export default getHolidays;

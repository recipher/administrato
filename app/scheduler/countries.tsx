import * as R from 'ramda';
import { HolidayAPI } from 'holidayapi';
import { populateHolidays } from './holidays.js';

const holidayAPI = new HolidayAPI({ key: process.env.HOLIDAY_API_KEY });

export const FX_COUNTRY = 'GB';

let data;

const codes = {
  Netherlands: 'NL',
};

const countries = {
  NL: 'Netherlands',
};

const trim = country => country
  .replace('LM-', '')
  .replace('LM- ', '')
  .replace('ICP-', '')
  .replace('ICP- ', '')
  .replace('ADP/', '')
  .replace('PEO/', '')
  .replace('Payworks/', '')
  .trim();

const fix = country => ({
    'Guatermala': 'Guatemala',
    'México': 'Mexico',
    'Maxico': 'Mexico',
    'Brasil': 'Brazil',
    'Irlanda': 'Ireland',
    'Moldava': 'Moldova',
    'Canda': 'Canada',
    'south korea': 'South Korea',
    'South korea': 'South Korea',
    'Phillipines': 'Philipines',
    'Republic of Moldova': 'Moldova',
    'Hungry': 'Hungary',
    'Korea, South': 'South Korea',
    'Czesh Republic': 'Czechia',
    'Czech Republic': 'Czechia',
    'CzechRepublic': 'Czechia',
    'japan': 'Japan',
    'US': 'United States',
    'UK': 'United Kingdom',
    'UNITED STATES OF AMERICA': 'United States',
    'United States of America': 'United States',
    'UNITED STATES': 'United States',
    'USA': 'United States',
    'Congo': 'Democratic Republic of the Congo',
    'Russia': 'Russian Federation',
    'UAE': 'United Arab Emirates',
    'Dubai UAE': 'United Arab Emirates',
    'Dubai/UAE': 'United Arab Emirates',
    'Netherland': 'Netherlands',
    'Chisinau': 'Moldova',
    'Amsterdam': 'Netherlands',
    'Columbia': 'Colombia',
    'Finaland': 'Finland',
    'Curacao': 'Curaçao',
    'Korea': 'South Korea',
    'Bolvia': 'Bolivia',
    'Costrica': 'Costa Rica',
    'Venzuela': 'Venezuela',
    'Dubai': 'United Arab Emirates',
    'Democratic Republic of Congo': 'Democratic Republic of the Congo',
    'Republic of Congo': 'Republic of the Congo',
    'Cote DIvoire': 'Ivory Coast',
    'St Maarten': 'Saint Martin',
    'Swaziland': 'Eswatini',
    'Malabo': 'Equatorial Guinea',
    'Trinidad & Tobago': 'Trinidad and Tobago',
    'Hongkong': 'Hong Kong',
    'HK': 'Hong Kong',    
    'HongKong': 'Hong Kong',    
    'LM india': 'India',
    'INDIA': 'India',
    'England': 'United Kingdom',
    'UNITED KINGDOM': 'United Kingdom',
    'Philipines': 'Phillipines',
    'Macau': 'Macao',
    'france': 'France',
    'FRANCE': 'France',
    'PORTUGAL': 'Portugal',
    'SPAIN': 'Spain',
    'ITALY': 'Italy',
    'MEXICO': 'Mexico',
    'HUNGARY': 'Hungary',
    'ROMANIA': 'Romania',
    'COLOMBIA': 'Colombia',
    'MOLDOVA': 'Moldova',
    'BRAZIL': 'Brazil',
    "BELIZE": 'Belize',       
    "BERMUDA": 'Bermuda',      
    "Virgin Islands": 'United States Virgin Islands',    
    "SWITZERLAND": 'Switzerland',
    'PUERTO RICO': 'Puerto Rico',
  }[trim(country)] || trim(country));

const getCountryCode = async name => {
  if (name === undefined) return;

  name = fix(name);  // Workaround broken data;

  if (codes[name] !== undefined) return codes[name];

  try {
    if (data === undefined) data = (await populateHolidays()).countries;

    const country = R.find(c => c.name === name, data);

    codes[country] = country.code; // memoize

    return country.code;
  } catch(e) {
    //
    // console.log(name);
  }
};

const getCountry = async code => {
  if (countries[code] !== undefined) return countries[code];

  try {
    if (data === undefined) data = (await populateHolidays()).countries;

    const country = R.find(c => c.code === code, data);

    if (country === undefined) return;

    countries[country] = country.name; // memoize

    return country.name;
  } catch(e) {
    return code;
  }
};

export { getCountryCode, getCountry };
import ExcelJS, { type Worksheet } from 'exceljs';
import fs from 'node:fs/promises';
import { format } from 'date-fns';

import { adjustForUTCOffset, format as formatISO9075 } from './date';

import { type LegalEntity } from '../manage/legal-entities.server';
import { type Milestone } from './milestones.server';
import { type ScheduleWithDates } from './schedules.server';
import { type Holiday } from './holidays.server';
import { type Country } from '../countries.server';

const COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const FONT = { name: 'Arial', family: 2, size: 14 };

const byIndexAsc = (l: any, r: any) => l.index - r.index;
const byIndexDesc = (l: any, r: any) => r.index - l.index;

const uniq = (items: Array<any>) => items.reduce((acc, i) => acc.includes(i) ? acc : acc.concat([i]), []);
const byDate = (l: string, r: string) => new Date(r).getTime() - new Date(l).getTime();

// // const range = (start, stop, step = 1) => 
// //   Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

// // const payOn = due => {
// //   if (due === undefined) return null;

// //   const out = ({ when = null, day }) => day === undefined ? when : [ when, day ].join(' ');

// //   if (Array.isArray(due)) return [ out(due[0]), out(due[1]) ].join(',');
// //   return out(due); 
// // };

// const toDateFromString = (s: string) => {
//   const [ y, m, d ] = s.split('-');
//   return new Date(Date.UTC(y, m-1, d));
// };

// const determineLocations = (country, info) => {
//   const LOCATIONS = {
//     // country: 'Payroll',
//     client: 'Client',
//     provider: 'ICP',
//     securityGroup: 'Safeguard',
//     // fxCountry: 'FX',
//   };

//   const match = (location, country) => info[location]?.split(',').includes(country);

//   return Object.keys(LOCATIONS).reduce((locations, location) => 
//     match(location, country) ? locations.concat([ LOCATIONS[location ]]) : locations, []).join(', ');
// };

const Service = () => {
  type ScheduleProps = {
    legalEntity: LegalEntity ;
    milestones: Array<Milestone>;
    schedules: Array<ScheduleWithDates>;
    start: Date;
    end: Date;
  };

  const addScheduleSheet = (worksheet: Worksheet, { legalEntity, milestones, schedules, start, end }: ScheduleProps) => {
    worksheet.properties.defaultColWidth = 20;

    const toSchedule = (s: ScheduleWithDates) => 
      [ s.name, ...s.scheduleDates.sort(byIndexAsc).map((date, i) => date.date) ];

  const toScheduleHeader = (milestones: Array<Milestone>) => [
    [ 'Milestone', ...milestones.map(ms => ms.description) ], 
    [ 'Interval', ...milestones.map(ms => Number.isNaN(ms.interval) ? null : ms.interval) ],
    [ 'Time Due', ...milestones.map(ms => ms.time) ]
  ];

    const header = [ 
      [ 'Client', legalEntity.clientId ], 
      [ 'Payroll', legalEntity.name ], 
      [ 'Country', '' ], 
      [ 'Pay Frequency', legalEntity.frequency ],
      [ 'Pay Date', legalEntity.target ],
      [ 'Period', `${format(start, 'd MMM yyyy')} to ${format(end, 'd MMM yyyy')}` ],
    ];
  
    const data = [ 
      ...header, 
      [], 
      ...toScheduleHeader(milestones.sort(byIndexAsc)), 
      [], 
      ...schedules.map(toSchedule),
    ];
  
    data.forEach(d => {
      const row = worksheet.addRow(d);
      row.font = FONT;
    });
  
    // addDatesOkay(worksheet, schedule, info);
    // if (options.useFormula) addWorkdayFormulas(worksheet, schedule, info);

    return worksheet;
  };
  
  const addHolidaySheet = (worksheet: Worksheet, { holidays, countries }: { holidays: Array<Holiday>, countries: Array<Country> }) => { 
    worksheet.properties.defaultColWidth = 20;
      
    const grouped = countries.map(c => ({
      country: c,
      holidays: uniq(holidays.filter(h => h.locality === c.isoCode).map(h => formatISO9075(h.date)).sort(byDate)),
    }));
  
    const longest = grouped.reduce((c, next) => next.holidays.length > c.holidays.length ? next : c, grouped[0]);
  
    // const findHolidayName = (c, date) => holidays.find(h => date === formatISO9075(h.date) && c === h.country).name;
    // const toHolidays = (_, i) => 
    //   grouped.map(c => i < c.holidays.length ? [ toDateFromString(c.holidays[i]), findHolidayName(c.country, c.holidays[i]) ] : [ null, null ] ).flat();
  
    // const heading = (c, i) => i === 0 ? `Holidays for ${c} (Legal Entity)` : `Holidays for ${c} (${determineLocations(c, info)})`;
  
    // [ grouped.map((c, index) => [ heading(c.country, index), null ]).flat(), ...longest.holidays.map(toHolidays) ]
    //   .forEach(d => {
    //     const row = worksheet.addRow(d);
    //     row.font = FONT;
    //   });

    return worksheet;
  };

  const addLogo = async (worksheet: Worksheet) => {
    const logo = worksheet.workbook.addImage({
      buffer: await fs.readFile(`${process.cwd()}/../public/images/sgg-logo.png`),
      extension: 'png',
    });
    worksheet.addImage(logo, 'D3:E5');
  };

  type GenerateProps = {
    legalEntity: LegalEntity;
    milestones: Array<Milestone>;
    schedules: Array<ScheduleWithDates>;
    holidays: Array<Holiday>;
    countries: Array<Country>;
    start: Date;
    end: Date;
  };
  
  const generate = async ({ legalEntity, milestones, schedules, holidays, countries, start, end }: GenerateProps) => {
    const workbook = new ExcelJS.Workbook();

    const scheduleSheet = addScheduleSheet(workbook.addWorksheet('schedule'), { legalEntity, milestones, schedules, start, end }) //, schedule, info, payrollCountry, holidays, year);
    addHolidaySheet(workbook.addWorksheet('holidays'), { holidays, countries });

    await addLogo(scheduleSheet);

    return workbook;
  };

  return { generate };
};

export default Service;
import ExcelJS, { type Worksheet } from 'exceljs';
import fs from 'node:fs/promises';

import { type LegalEntity } from '../manage/legal-entities.server';
import { Milestone } from './milestones.server';

const COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const FONT = { name: 'Arial', family: 2, size: 14 };

const byIndexAsc = (l: any, r: any) => l.index - r.index;

const Service = () => {

  type ScheduleProps = {
    legalEntity: LegalEntity ;
    milestones: Array<Milestone>;
  };

  // const addScheduleSheet = (worksheet, schedule, info, country, holidays, year, options = { useFormula: true }) => {
  const addScheduleSheet = (worksheet: Worksheet, { legalEntity, milestones }: ScheduleProps) => {
    worksheet.properties.defaultColWidth = 20;
  
    // const toSchedule = s => [ s.period, ...s.dates.sort(byIndexDesc).map((date, i) => date.due) ];
    // // const toSchedule = s => [ s.period, ...s.dates.sort(byIndexDesc).map((date, i) => i === s.dates.length-1 ? date.due : null) ];

  const toScheduleHeader = (milestones: Array<Milestone>) => [
    [ 'Milestone', ...milestones.map(ms => ms.description) ], 
    [ 'Interval', ...milestones.map(ms => Number.isNaN(ms.interval) ? null : ms.interval) ],
    [ 'Time Due', ...milestones.map(ms => ms.time) ]
  ];

    const header = [ 
      [ 'Client', '' ], 
      [ 'Payroll', legalEntity.name ], 
      [ 'Country', '' ], 
      [ 'Pay Frequency', legalEntity.frequency ],
      [ 'Pay Date', legalEntity.target ],
      [ 'Period', '' ],
    ];
  
    const data = [ ...header, [], ...toScheduleHeader(milestones.sort(byIndexAsc)) ] //, ...schedule.map(toSchedule) ]
  
    data.forEach(d => {
      const row = worksheet.addRow(d);
      row.font = FONT;
    });
  
    // addDatesOkay(worksheet, schedule, info);
    // if (options.useFormula) addWorkdayFormulas(worksheet, schedule, info);

    return worksheet;
  };
  
  const addHolidaySheet = (worksheet: Worksheet) => { //, holidays, info) => {
    worksheet.properties.defaultColWidth = 20;

    // const { country, countries, errors } = info;
      
    // const grouped = countries.concat([ country ]).sort(byPayrollCountry(country))
    //   .map(c => ({
    //     country: c,
    //     holidays: uniq(holidays.filter(h => h.country === c).map(h => format(h.date)).sort(byDate)),
    //   }));
  
    // const longest = grouped.reduce((c, next) => next.holidays.length > c.holidays.length ? next : c, grouped[0]);
  
    // const findHolidayName = (c, date) => holidays.find(h => date === format(h.date) && c === h.country).name;
    // const toHolidays = (_, i) => 
    //   grouped.map(c => i < c.holidays.length ? [ toDateFromString(c.holidays[i]), findHolidayName(c.country, c.holidays[i]) ] : [ null, null ] ).flat();
  
    // const heading = (c, i) => i === 0 ? `Holidays for ${c} (Payroll)` : `Holidays for ${c} (${determineLocations(c, info)})`;
  
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
  };
  
  const generate = async ({ legalEntity, milestones }: GenerateProps) => {
    const workbook = new ExcelJS.Workbook();

    const scheduleSheet = addScheduleSheet(workbook.addWorksheet('schedule'), { legalEntity, milestones }) //, schedule, info, payrollCountry, holidays, year);
    addHolidaySheet(workbook.addWorksheet('holidays'));

    await addLogo(scheduleSheet);

    return workbook;
  };

  return { generate };
};

export default Service;
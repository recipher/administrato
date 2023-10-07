import { formatISO9075 } from 'date-fns';

export const adjustForUTCOffset = (date: Date) => {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
};

export const format = (date: Date) => formatISO9075(adjustForUTCOffset(date), { representation: 'date' });

export const addDays = (date: Date, offset: number) => {
  const copy = new Date(date);
  copy.setUTCDate(date.getUTCDate() + offset);
  return copy;
};
export const nextDay = (date: Date, d = 1) => addDays(date, d);
export const previousDay = (date: Date, d = 1) => addDays(date, d * -1);

export const parseISO = (date: string) => {
  const [ y, m, d ] = date.split('-');

  if (y === undefined || m === undefined || d === undefined) throw new Error('Invalid UTC date');

  return new Date(Date.UTC(parseInt(y), parseInt(m)-1, parseInt(d)));
};

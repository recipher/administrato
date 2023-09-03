import { formatISO9075 } from 'date-fns';

const adjustForUTCOffset = date => {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
};

const format = date => formatISO9075(adjustForUTCOffset(date), { representation: 'date' });

const addDays = (date, offset) => {
  const copy = new Date(date);
  copy.setUTCDate(date.getUTCDate() + offset);
  return copy;
};
const nextDay = (date, d = 1) => addDays(date, d);
const previousDay = (date, d = 1) => addDays(date, d * -1);

const parseISO = date => {
  const [ y, m, d ] = date.split('-');
  return new Date(Date.UTC(y, m-1, d));
};

export { addDays, nextDay, previousDay, parseISO, format, adjustForUTCOffset };
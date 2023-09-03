export type Holiday = {
  name: string;
  date: string;
  observed: string;
  country: BigInteger;
};

const addHoliday = async (holiday: Holiday) => {
  return holiday;
};

const getHolidaysByCountry = async (country: string) => {
  console.log(country);
  const holiday = { name: 'Christmas Day' } as Holiday;
  return [ holiday ];
};

export default {
  addHoliday,
  getHolidaysByCountry,
};
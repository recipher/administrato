export type QueryOptions = {
  offset?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | null;
  sortDirection?: string | null;
};

export type SearchOptions = {
  search: string | null | undefined;
};

export const ASC = 'asc'
export const DESC = 'desc';

export type IdProp = {
  id: number | string;
};

export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};

export type SecurityKeys = Array<SecurityKey>;

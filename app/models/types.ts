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
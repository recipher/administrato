export type QueryOptions = {
  offset?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | null;
  sortDirection?: string | null;
};

export const ASC = 'asc'
export const DESC = 'desc';
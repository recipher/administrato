export type QueryOptions = {
  offset?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | null;
  sortDirection?: string | null;
};

export type SearchOptions = {
  search: string | null | undefined;
};

export const ASC = 'ASC'
export const DESC = 'DESC';

export type IdProp = {
  id: number | string;
};

export type NameProp = {
  name: string;
};

export type Count = {
  count: number;
};

export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};

export type SecurityKeys = Array<SecurityKey>;

export type BypassKeyCheck = { bypassKeyCheck?: boolean };

export type KeyQueryOptions = {
  keys?: SecurityKeys;
  isArchived?: boolean;
} & QueryOptions & BypassKeyCheck;
export type ListOption = { value: string; label: string };

export type ListFilter = {
  key: string;
  label: string;
  options: readonly ListOption[];
};

/** Serializable controls only; records and fetching remain in the feature module. */
export type ListState = {
  primaryFilter: string;
  search: string;
  filters: Record<string, string>;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  pageSize: number;
  page: number;
};

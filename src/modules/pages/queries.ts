import { queryOptions } from '@tanstack/react-query';
import { getPage, getPages, getImages } from './api';
export const pagesKeys = { all: ['pages'] as const, detail: (id: string) => ['pages', 'detail', id] as const };
export function pageQueryOptions(id: string) { return queryOptions({ queryKey: pagesKeys.detail(id), queryFn: ({ signal }) => getPage(id, signal), staleTime: 30_000 }); }
export function pagesQueryOptions(search: string, page: number) { return queryOptions({ queryKey: ['pages', 'list', search, page], queryFn: ({ signal }) => getPages({ search, page }, signal), staleTime: 30_000 }); }
export function imagesQueryOptions(page: number) { return queryOptions({ queryKey: ['pages', 'images', page], queryFn: ({ signal }) => getImages(page, signal), staleTime: 30_000 }); }

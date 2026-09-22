import { queryOptions } from '@tanstack/react-query';
import { getEmail, getEmails, getEmailEvents, getEmailActivity } from './api';

export const emailsKeys = { all: ['emails'] as const, lists: ['emails', 'list'] as const, list: (input: Parameters<typeof getEmails>[0]) => ['emails', 'list', input] as const, campaign: (id: string) => ['emails', 'campaign', id] as const, detail: (id: string) => ['emails', 'campaign', id, 'detail'] as const };
export function emailsQueryOptions(input: Parameters<typeof getEmails>[0]) { return queryOptions({ queryKey: emailsKeys.list(input), queryFn: ({ signal }) => getEmails(input, signal), staleTime: 30_000 }); }
export function emailQueryOptions(id: string) { return queryOptions({ queryKey: emailsKeys.detail(id), queryFn: ({ signal }) => getEmail(id, signal), staleTime: 30_000 }); }
export function emailEventsQueryOptions(id: string, input: Parameters<typeof getEmailEvents>[1]) { return queryOptions({ queryKey: [...emailsKeys.campaign(id), 'events', input], queryFn: ({ signal }) => getEmailEvents(id, input, signal), staleTime: 30_000 }); }
export function emailActivityQueryOptions(id: string, input: Parameters<typeof getEmailActivity>[1]) { return queryOptions({ queryKey: [...emailsKeys.campaign(id), 'activity', input], queryFn: ({ signal }) => getEmailActivity(id, input, signal), staleTime: 30_000 }); }

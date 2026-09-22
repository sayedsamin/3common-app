import { ApiError } from '@/lib/api-client';
export function contactErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'conflict') return 'A contact with this email already exists. Use a different email or open the existing contact.';
    if (error.code === 'not_found') return 'This contact could not be found or is no longer available.';
    return error.message;
  }
  return 'Unable to complete this request. Please try again.';
}
export function contactLabel(value: string) { return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, letter => letter.toUpperCase()); }
export function contactDate(value: number | string | undefined) {
  if (value === undefined) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

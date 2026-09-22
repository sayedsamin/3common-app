import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { ListPagination, ListToolbar, type ListState } from '../index';

const initial: ListState = {
  primaryFilter: 'all', search: '', filters: {}, sortField: 'name', sortDirection: 'asc', pageSize: 10, page: 3,
};

function Harness({ total = 42 }: { total?: number }) {
  const [value, setValue] = useState(initial);
  return <>
    <ListToolbar value={value} onChange={setValue}
      primaryOptions={[{ value: 'all', label: 'All' }, { value: 'past', label: 'Past' }]}
      sortOptions={[{ value: 'name', label: 'Name' }, { value: 'date', label: 'Date' }]}
      filters={[{ key: 'location', label: 'Location', options: [{ value: 'online', label: 'Online' }] }]} />
    <ListPagination value={value} onChange={setValue} totalItems={total} />
  </>;
}

test('search and primary filters reset pagination', async () => {
  await renderWithProviders(<Harness />);
  expect(screen.getByText('21–30 of 42 items')).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Search'), 'community');
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('1');
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Primary filter: Past' }));
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('1');
  expect(screen.getByRole('button', { name: 'Primary filter: Past', selected: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByLabelText('Search')).toHaveDisplayValue('');
});

test('applies and clears additional filters and reverses a selected sort field', async () => {
  await renderWithProviders(<Harness />);
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Location: Online' }));
  expect(screen.getByRole('button', { name: 'Filters (1)' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('1');
  await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByRole('button', { name: 'Filters' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Name' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sort by Date' }));
  await fireEvent.press(screen.getByRole('button', { name: /Sort direction: ascending/ }));
  expect(screen.getByRole('button', { name: 'Sort: Date' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /Sort direction: descending/ })).toBeOnTheScreen();
});

test('validates page jumps, bounds navigation and resets on page size changes', async () => {
  await renderWithProviders(<Harness />);
  await fireEvent.changeText(screen.getByLabelText('Page number'), '6');
  expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Page number'), '5');
  await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
  expect(screen.getByText('41–42 of 42 items')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Items per page: 10' }));
  await fireEvent.press(screen.getByRole('button', { name: '25 items per page' }));
  expect(screen.getByText('1–25 of 42 items')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
});

test('empty lists have no navigable pages', async () => {
  await renderWithProviders(<Harness total={0} />);
  expect(screen.getByText('0 items')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByLabelText('Page number')).toBeDisabled();
});

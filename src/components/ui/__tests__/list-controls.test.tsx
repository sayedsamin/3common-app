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
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Primary filter: Past' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('1');
  expect(screen.getByRole('button', { name: 'Remove status filter' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByLabelText('Search')).toHaveDisplayValue('');
});

test('applies and clears additional filters and reverses a selected sort field', async () => {
  await renderWithProviders(<Harness />);
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Location: Online' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByRole('button', { name: 'Filters (1)' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('1');
  await fireEvent.press(screen.getByRole('button', { name: 'Remove location filter' }));
  expect(screen.getByRole('button', { name: 'Filters' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Name' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Sort by Date' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Descending' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply sort' }));
  expect(screen.getByRole('button', { name: 'Sort: Date' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Date' }));
  expect(screen.getByRole('radio', { name: 'Descending', checked: true })).toBeOnTheScreen();
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

test('closing a sheet discards draft filters and sorting', async () => {
  await renderWithProviders(<Harness />);
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Primary filter: Past' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Close options' }));
  expect(screen.queryByRole('button', { name: 'Remove status filter' })).toBeNull();
  expect(screen.getByLabelText('Page number')).toHaveDisplayValue('3');
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Name' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Sort by Date' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss options', includeHiddenElements: true }));
  expect(screen.getByRole('button', { name: 'Sort: Name' })).toBeOnTheScreen();
});

test('compact pagination uses hasMore without inventing a total', async () => {
  const onChange = jest.fn();
  const view = await renderWithProviders(<ListPagination variant="compact" value={{ ...initial, page: 1 }} hasMore onChange={onChange} />);
  expect(screen.getByText('Page 1')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Page number')).toBeNull();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(onChange).toHaveBeenCalledWith({ ...initial, page: 2 });
  await view.rerender(<ListPagination variant="compact" value={{ ...initial, page: 2 }} hasMore={false} onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

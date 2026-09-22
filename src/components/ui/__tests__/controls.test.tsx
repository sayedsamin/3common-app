import { fireEvent, screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render';
import { Badge, Button, Input } from '../index';

test.each([{ disabled: true }, { loading: true }])('prevents activation when unavailable: %j', async (props) => {
  const onPress = jest.fn();
  await renderWithProviders(<Button label="Save" onPress={onPress} {...props} />);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeDisabled();
  await userEvent.setup().press(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('allows an enabled action and exposes busy state while loading', async () => {
  const onPress = jest.fn();
  const view = await renderWithProviders(<Button label="Save" onPress={onPress} />);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await view.rerender(<Button label="Save" loading />);
  expect(screen.getByRole('button', { name: 'Save', busy: true })).toBeOnTheScreen();
});

test('preserves field callbacks and announces validation errors', async () => {
  const onChangeText = jest.fn();
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  const view = await renderWithProviders(<Input label="Event" helperText="Use a short title" onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur} />);
  const input = screen.getByLabelText('Event');
  await fireEvent(input, 'focus', { nativeEvent: {} });
  await fireEvent.changeText(input, 'Community day');
  await fireEvent(input, 'blur', { nativeEvent: {} });
  expect(onChangeText).toHaveBeenCalledWith('Community day');
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(onBlur).toHaveBeenCalledTimes(1);
  await view.rerender(<Input label="Event" error="Title is required" disabled />);
  expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
  expect(screen.getByLabelText('Event')).toBeDisabled();
});

test.each(['neutral', 'success', 'warning', 'danger', 'insight'] as const)('keeps %s status understandable without color', async (variant) => {
  await renderWithProviders(<Badge label="Sample status" variant={variant} />);
  expect(screen.getByText('Sample status')).toBeOnTheScreen();
});

import { Input, type InputProps } from './Input';
export function SearchInput({ onChangeText, ...props }: Omit<InputProps, 'label'> & { label?: string }) {
  return <Input label="Search" hideLabel leadingIcon="magnify" placeholder="Search" autoCapitalize="none" autoCorrect={false} returnKeyType="search"
    clearLabel="Clear search" onClear={() => onChangeText?.('')} onChangeText={onChangeText} {...props} />;
}

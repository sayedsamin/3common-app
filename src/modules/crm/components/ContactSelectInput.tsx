import { useState } from 'react';
import { View } from 'react-native';
import { Button, ErrorState, Input, LoadingState, Text } from '@/components/ui';
import { useContactSearch } from '../hooks';
import type { Contact } from '../schemas';
import { contactErrorMessage } from '../utils';

function contactOptionLabel(contact: Contact) {
  return [contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' '), contact.email || contact.phone].filter(Boolean).join(' · ') || 'Unnamed contact';
}

export function ContactSelectInput({ value, selectedLabel, onSelect, onClear, disabled = false, error, label = 'Customer' }: {
  value: string; selectedLabel?: string; onSelect: (contact: Contact) => void; onClear?: () => void;
  disabled?: boolean; error?: string; label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { search, setSearch, page, setPage, query, isSearchPending } = useContactSearch(isOpen && !disabled);
  const isBusy = query.isFetching || isSearchPending;
  const contacts = isSearchPending ? [] : query.data?.data ?? [];
  return <View className="gap-2">
    <Text variant="label">{label}</Text>
    <Button label={value ? selectedLabel || 'Selected customer' : 'Search and select a customer'} accessibilityLabel={`Choose ${label.toLowerCase()}`} variant="secondary" disabled={disabled} accessibilityState={{ expanded: isOpen }} trailingIcon={isOpen ? 'chevron-up' : 'chevron-down'} onPress={() => setIsOpen(previous => !previous)} />
    {error ? <Text accessibilityRole="alert" className="text-danger">{error}</Text> : null}
    {isOpen && !disabled ? <View className="gap-3 rounded-control border border-border p-3">
      <Input label="Search contacts" placeholder="Search by name or email" value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} />
      {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. Connect to search contacts.</Text> : null}
      {query.error && !isSearchPending ? <ErrorState message={contactErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
      {isBusy ? <LoadingState label="Searching contacts..." /> : null}
      {/* Five results per page keep this dropdown short inside screen/sheet scroll views. */}
      {contacts.map(contact => <View key={contact.id} className="gap-1">
        <Button label={contactOptionLabel(contact)} accessibilityLabel={`Select contact ${contactOptionLabel(contact)}`} variant="ghost" disabled={isBusy || Boolean(query.error) || query.fetchStatus === 'paused'} accessibilityRole="radio" accessibilityState={{ checked: value === contact.id }} onPress={() => { onSelect(contact); setIsOpen(false); }} />
      </View>)}
      {!isBusy && !query.error && query.fetchStatus !== 'paused' && contacts.length === 0 ? <Text>No contacts found. Try another name or email.</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        <Button label="Previous contacts" variant="secondary" disabled={page === 0 || isBusy} onPress={() => setPage(page - 1)} />
        <Button label="Next contacts" variant="secondary" disabled={!query.data?.hasMore || isBusy} onPress={() => setPage(page + 1)} />
        {value && onClear ? <Button label="Clear customer selection" variant="ghost" onPress={() => { onClear(); setIsOpen(false); }} /> : null}
      </View>
    </View> : null}
  </View>;
}

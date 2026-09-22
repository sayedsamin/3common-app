import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/ui';
import { contactQueryOptions } from '../queries';
import { ContactForm } from '../components/ContactForm';
import { ContactQueryState } from '../components/ContactQueryState';

export function CreateContactScreen() { return <ContactForm />; }
export function EditContactScreen({ contactId }: { contactId: string }) {
  const query = useQuery({ ...contactQueryOptions(contactId), refetchOnMount: 'always' });
  if (query.data && (query.isFetchedAfterMount || !query.isFetching)) return <ContactForm key={contactId} contact={query.data}
    notice={query.error ? 'The latest contact could not be loaded. These are previously loaded values.' : query.fetchStatus === 'paused' ? 'You are offline. Connect before saving.' : undefined} />;
  return <Screen edges={['left', 'right', 'bottom']}><ContactQueryState query={query} label="contact to edit" /></Screen>;
}

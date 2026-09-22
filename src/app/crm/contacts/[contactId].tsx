import { useLocalSearchParams } from 'expo-router';
import { ContactDetailsScreen, InvalidContactScreen, contactRouteSchema } from '@/modules/crm';
export default function ContactRoute() {
  const result = contactRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <ContactDetailsScreen contactId={result.data.contactId} /> : <InvalidContactScreen />;
}

import { useLocalSearchParams } from 'expo-router';
import { EditContactScreen, InvalidContactScreen, contactRouteSchema } from '@/modules/crm';
export default function ContactRoute() {
  const result = contactRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <EditContactScreen contactId={result.data.contactId} /> : <InvalidContactScreen />;
}

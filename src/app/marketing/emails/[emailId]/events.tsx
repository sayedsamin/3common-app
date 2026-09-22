import { useLocalSearchParams } from 'expo-router';
import { EmailEventsScreen, InvalidEmailScreen, emailRouteSchema } from '@/modules/emails';
export default function EmailRoute() { const result = emailRouteSchema.safeParse(useLocalSearchParams()); return result.success ? <EmailEventsScreen emailId={result.data.emailId} /> : <InvalidEmailScreen />; }

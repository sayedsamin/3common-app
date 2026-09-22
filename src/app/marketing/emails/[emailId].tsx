import { useLocalSearchParams } from 'expo-router';
import { EmailDetailsScreen, InvalidEmailScreen, emailRouteSchema } from '@/modules/emails';
export default function EmailRoute() { const result = emailRouteSchema.safeParse(useLocalSearchParams()); return result.success ? <EmailDetailsScreen emailId={result.data.emailId} /> : <InvalidEmailScreen />; }

import { useLocalSearchParams } from 'expo-router';
import { EmailActivityScreen, InvalidEmailScreen, emailRouteSchema } from '@/modules/emails';
export default function EmailRoute() { const result = emailRouteSchema.safeParse(useLocalSearchParams()); return result.success ? <EmailActivityScreen emailId={result.data.emailId} /> : <InvalidEmailScreen />; }

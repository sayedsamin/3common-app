import { useLocalSearchParams } from 'expo-router';
import { EditEmailScreen, InvalidEmailScreen, emailRouteSchema } from '@/modules/emails';
export default function EmailRoute() { const result = emailRouteSchema.safeParse(useLocalSearchParams()); return result.success ? <EditEmailScreen emailId={result.data.emailId} /> : <InvalidEmailScreen />; }

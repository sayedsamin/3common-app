import { useLocalSearchParams } from 'expo-router';
import { EditSegmentScreen, InvalidSegmentScreen, segmentRouteSchema } from '@/modules/crm';

export default function SegmentRoute() {
  const params = segmentRouteSchema.safeParse(useLocalSearchParams());
  return params.success ? <EditSegmentScreen segmentId={params.data.segmentId} /> : <InvalidSegmentScreen />;
}

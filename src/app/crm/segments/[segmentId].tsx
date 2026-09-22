import { useLocalSearchParams } from 'expo-router';
import { SegmentDetailsScreen, InvalidSegmentScreen, segmentRouteSchema } from '@/modules/crm';

export default function SegmentRoute() {
  const params = segmentRouteSchema.safeParse(useLocalSearchParams());
  return params.success ? <SegmentDetailsScreen segmentId={params.data.segmentId} /> : <InvalidSegmentScreen />;
}

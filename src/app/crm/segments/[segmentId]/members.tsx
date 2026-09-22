import { useLocalSearchParams } from 'expo-router';
import { SegmentMembersScreen, InvalidSegmentScreen, segmentRouteSchema } from '@/modules/crm';

export default function SegmentRoute() {
  const params = segmentRouteSchema.safeParse(useLocalSearchParams());
  return params.success ? <SegmentMembersScreen segmentId={params.data.segmentId} /> : <InvalidSegmentScreen />;
}

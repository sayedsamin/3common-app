export { ContactsScreen } from './screens/ContactsScreen';
export { PropertiesScreen } from './screens/CRMScreens';
export { ContactDetailsScreen, InvalidContactScreen } from './screens/ContactDetailsScreen';
export { CreateContactScreen, EditContactScreen } from './screens/ContactEditorScreen';
export { ContactActivityScreen } from './screens/ContactActivityScreen';
export { contactRouteSchema } from './schemas';
export { ContactSelectInput } from './components/ContactSelectInput';
export type { Contact, ContactsInput, ActivityInput, ContactActivity, CreateContact, UpdateContact } from './schemas';

export { SegmentsScreen } from './segments/screens/SegmentsScreen';
export { SegmentDetailsScreen, InvalidSegmentScreen } from './segments/screens/SegmentDetailsScreen';
export { CreateSegmentScreen, EditSegmentScreen } from './segments/screens/SegmentEditorScreen';
export { SegmentMembersScreen } from './segments/screens/SegmentMembersScreen';
export { segmentRouteSchema } from './segments/schemas';
export type { Segment, SegmentMember, CreateSegment, UpdateSegment, SegmentsInput, SegmentMembersInput, SegmentsByMemberInput } from './segments/schemas';

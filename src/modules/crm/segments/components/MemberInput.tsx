import { useState } from 'react';
import { Input } from '@/components/ui';
import { ContactSelectInput } from '../../components/ContactSelectInput';
import type { TargetType } from '../schemas';

export function MemberInput({ targetType, value, onChange, disabled, error }: { targetType?: TargetType; value: string; onChange: (value: string) => void; disabled?: boolean; error?: string }) {
  const [label, setLabel] = useState('');
  return targetType === 'contact' ? <ContactSelectInput label="Member" value={value} selectedLabel={label} error={error} disabled={disabled}
    onSelect={contact => { setLabel(contact.fullName || contact.email); onChange(contact.id); }} onClear={() => { setLabel(''); onChange(''); }} />
    : <Input label="Member ID" value={value} onChangeText={onChange} error={error} disabled={disabled} autoCapitalize="none" autoCorrect={false} />;
}

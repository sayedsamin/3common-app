import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';
import { Button, FilterSelect, Input, Screen, Text } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { buildFilterGroup } from '@/lib/filter-builder';
import { SegmentFilters } from '../components/SegmentFilters';
import { SegmentQueryState } from '../components/SegmentQueryState';
import { useCreateSegment, useUpdateSegment } from '../mutations';
import { segmentQueryOptions } from '../queries';
import { createSegmentSchema, segmentFieldErrorsSchema, segmentFormSchema, segmentKindSchema, segmentStatusSchema, targetTypeSchema, updateSegmentSchema, type Segment, type SegmentFormValues, type UpdateSegment } from '../schemas';
import { contactFilterFields, readSegmentFilters, segmentErrorMessage } from '../utils';

function SegmentForm({ segment }: { segment?: Segment }) {
  const create = useCreateSegment();
  const update = useUpdateSegment(segment?.id ?? '');
  const [drafts, setDrafts] = useState(() => segment ? readSegmentFilters(segment.filters, segment.targetType === 'contact' ? contactFilterFields : []) : []);
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  const { control, setValue, setError: setFieldError, handleSubmit, formState } = useForm<SegmentFormValues>({ defaultValues: {
    name: segment?.name ?? '', description: segment?.description ?? '', targetType: segment?.targetType ?? 'contact', kind: segment?.kind ?? 'active',
    status: segment?.status ?? 'active', formId: segment?.formId ?? '', folderId: segment?.folderId ?? '',
    refreshIntervalMs: segment?.refreshIntervalMs === undefined ? '' : String(segment.refreshIntervalMs), trackMembershipEvents: segment?.trackMembershipEvents ?? true,
  } });
  const { dirtyFields, isSubmitting } = formState;
  const target = useWatch({ control, name: 'targetType' });
  const kind = useWatch({ control, name: 'kind' });
  const status = useWatch({ control, name: 'status' });
  const trackMembershipEvents = useWatch({ control, name: 'trackMembershipEvents' });
  const isPending = isSubmitting || create.isPending || update.isPending;
  const onSubmit = () => handleSubmit(async raw => {
    if (submitting.current) return;
    setError(undefined);
    const parsed = segmentFormSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = segmentFormSchema.keyof().safeParse(issue.path[0]);
        if (field.success) setFieldError(field.data, { message: issue.message });
      }
      return;
    }
    const values = parsed.data;
    submitting.current = true;
    try {
      let saved: Segment;
      if (segment) {
        const changes: UpdateSegment = {};
        if (dirtyFields.name) changes.name = values.name;
        if (dirtyFields.description) changes.description = values.description;
        if (dirtyFields.folderId) {
          if (!values.folderId) { setFieldError('folderId', { message: 'The API does not support clearing a saved folder. Enter a folder ID.' }); return; }
          changes.folderId = values.folderId;
        }
        if (dirtyFields.refreshIntervalMs) {
          if (!values.refreshIntervalMs) { setFieldError('refreshIntervalMs', { message: 'Enter an interval; clearing a saved interval is not supported.' }); return; }
          changes.refreshIntervalMs = Number(values.refreshIntervalMs);
        }
        if (dirtyFields.trackMembershipEvents) changes.trackMembershipEvents = values.trackMembershipEvents;
        if (filtersChanged && drafts) changes.filters = drafts.map(buildFilterGroup);
        if (!Object.keys(changes).length) { setError('Make a change before saving.'); return; }
        saved = await update.mutateAsync(updateSegmentSchema.parse(changes));
      } else {
        saved = await create.mutateAsync(createSegmentSchema.parse({ ...values,
          folderId: values.folderId || undefined, formId: values.formId || undefined,
          refreshIntervalMs: values.refreshIntervalMs ? Number(values.refreshIntervalMs) : undefined, filters: (drafts ?? []).map(buildFilterGroup),
        }));
      }
      router.replace({ pathname: '/crm/segments/[segmentId]', params: { segmentId: saved.id } });
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'validation') {
        const fields = segmentFieldErrorsSchema.safeParse(failure.details?.fieldErrors ?? failure.details?.fields ?? failure.details);
        if (fields.success) for (const [key, message] of Object.entries(fields.data)) {
          const field = segmentFormSchema.keyof().safeParse(key.replace(/^(input|update)\./, ''));
          if (field.success) setFieldError(field.data, { message: typeof message === 'string' ? message : message.join(' ') });
        }
      }
      if (failure instanceof ApiError && failure.code === 'conflict') setFieldError('name', { message: segmentErrorMessage(failure) });
      else if (failure instanceof ApiError) setError(segmentErrorMessage(failure));
      else setError(failure instanceof Error && !('issues' in failure) ? failure.message : 'Check the form and add at least one valid filter group.');
    } finally { submitting.current = false; }
  })();
  return <View className="gap-4">
    {(['name', 'description', 'folderId', 'refreshIntervalMs'] as const).map(name => <Controller key={name} control={control} name={name} render={({ field, fieldState }) => <Input
      label={({ name: 'Name', description: 'Description', folderId: 'Folder ID (optional)', refreshIntervalMs: 'Refresh interval in milliseconds (optional)' })[name]}
      value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} disabled={isPending}
      autoCapitalize={name === 'folderId' ? 'none' : 'sentences'} keyboardType={name === 'refreshIntervalMs' ? 'number-pad' : 'default'} /> } />)}
    {!segment ? <>
      <FilterSelect label="Target type" value={target} options={targetTypeSchema.options.map(value => ({ value, label: value }))} onChange={value => { if (!isPending) { setValue('targetType', value, { shouldDirty: true }); setDrafts([]); } }} />
      <FilterSelect label="Kind" value={kind} options={segmentKindSchema.options.map(value => ({ value, label: value }))} onChange={value => { if (!isPending) setValue('kind', value); }} />
      <FilterSelect label="Status" value={status} options={segmentStatusSchema.options.map(value => ({ value, label: value }))} onChange={value => { if (!isPending) setValue('status', value); }} />
      <Controller name="formId" control={control} render={({ field, fieldState }) => <Input label="Form ID (optional)" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} disabled={isPending} autoCapitalize="none" />} />
    </> : <Text>Target: {segment.targetType} · Kind: {segment.kind} · Status: {segment.status}</Text>}
    <View className="flex-row items-center justify-between"><Text>Track membership events</Text><Switch accessibilityLabel="Track membership events" disabled={isPending} value={trackMembershipEvents} onValueChange={value => setValue('trackMembershipEvents', value, { shouldDirty: true })} /></View>
    {target !== 'contact' ? <Text variant="muted">Enter backend field names and their value types. Supported fields depend on the selected target.</Text> : null}
    <Text variant="muted">Both active and static segments require filters when created.</Text>
    <SegmentFilters fields={target === 'contact' ? contactFilterFields : []} value={drafts} onChange={value => { if (!isPending) { setDrafts(value); setFiltersChanged(true); } }} />
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <Button label={segment ? 'Save segment' : 'Create segment'} loading={isPending} onPress={() => void onSubmit()} />
    <Button label="Cancel" variant="ghost" disabled={isPending} onPress={() => segment ? router.replace({ pathname: '/crm/segments/[segmentId]', params: { segmentId: segment.id } }) : router.replace('/crm/segments')} />
  </View>;
}
export function CreateSegmentScreen() { return <Screen edges={['left', 'right', 'bottom']}><SegmentForm /></Screen>; }
export function EditSegmentScreen({ segmentId }: { segmentId: string }) {
  const query = useQuery(segmentQueryOptions(segmentId));
  return <Screen edges={['left', 'right', 'bottom']}><SegmentQueryState query={query} label="segment" />{query.data ? <SegmentForm key={segmentId} segment={query.data} /> : null}</Screen>;
}

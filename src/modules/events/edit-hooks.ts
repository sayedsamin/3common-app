import { useRef, useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import { eventEditPatch, eventEditSchema, eventEditValues, type EventEditValues } from './edit-schemas';
import { useUpdateEvent } from './mutations';
import type { Event } from './schemas';
import { eventErrorMessage } from './utils';

function formPath(path: string): FieldPath<EventEditValues> | undefined {
  const root = eventEditSchema.keyof().safeParse(path);
  if (root.success) return root.data;
  if (path === 'customTerms.url' || path === 'customTerms.content' || path === 'customTerms.type' || path === 'customTerms.hasCustomTerms') return path;
  const block = /^descriptionBlocks\.(\d+)\.content$/.exec(path);
  return block ? `descriptionBlocks.${Number(block[1])}.content` : undefined;
}

export function useEventEditor(event: Event) {
  const [defaults] = useState(() => eventEditValues(event));
  const initial = useRef(defaults);
  const form = useForm<EventEditValues>({ defaultValues: defaults });
  const mutation = useUpdateEvent(event.id);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const onSubmit = () => form.handleSubmit(async values => {
    if (saving.current) return;
    saving.current = true;
    setSaved(false);
    form.clearErrors();
    try {
      const result = eventEditPatch(values, initial.current);
      if (!result.success) {
        for (const issue of result.error.issues) form.setError(formPath(issue.path.join('.')) ?? 'root', { message: issue.message });
        form.setError('root', { message: result.error.issues[0]?.message ?? 'Check the highlighted fields.' });
        return;
      }
      await mutation.mutateAsync(result.data);
      initial.current = values;
      form.reset(values);
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'validation') {
        const details = error.details;
        const fields = z.record(z.string(), z.union([z.string(), z.array(z.string())])).safeParse(details?.fieldErrors ?? details?.fields ?? details);
        if (fields.success) for (const [key, messages] of Object.entries(fields.data)) {
          const path = formPath(key);
          if (path) form.setError(path, { message: typeof messages === 'string' ? messages : messages.join(' ') });
        }
      }
      form.setError('root', { message: error instanceof ApiError && ['timeout', 'network', 'response'].includes(error.code)
        ? 'We could not confirm the save. Your edits are kept here. Check the event before trying again.' : eventErrorMessage(error) });
    } finally { saving.current = false; }
  })();
  return { form, onSubmit, saved };
}

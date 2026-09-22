import { z } from 'zod';
import { createEmailBodySchema, emailResponseSchema, emailsInputSchema, updateEmailBodySchema } from './contracts';

export const emailIdSchema = z.string().min(1).regex(/^[^\s/\\?#]+$/).refine(value => value !== '.' && value !== '..');
export const emailRouteSchema = z.object({ emailId: emailIdSchema });
export const emailSchema = emailResponseSchema.shape.data;
export const filterConditionSchema = z.object({ field: z.string().min(1), operator: z.enum(['is_equal_to_any_of', 'is_not_equal_to_any_of', 'contains', 'contains_exactly', 'is_before', 'is_after', 'is_between', 'is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to', 'is_any_of', 'is_none_of', 'is_empty', 'is_not_empty']), value: z.json().optional() });
export const filterGroupSchema = z.object({ logic: z.enum(['and', 'or']), get conditions() { return z.array(z.union([filterConditionSchema, filterGroupSchema])); } });
export const filtersSchema = z.array(filterGroupSchema);
export const emailFormSchema = z.object({ subject: z.string(), display_name: z.string(), reply_to_email: z.union([z.email(), z.literal('')]), recipients: z.string().refine(value => value.split(/[\s,;]+/).filter(Boolean).every(address => z.email().safeParse(address).success), 'Enter valid email addresses separated by commas or new lines.'), event_refs: z.array(z.string()), sync_event_recipients: z.boolean(), page_id: z.string() });
export type Email = z.infer<typeof emailSchema>;
export type EmailsInput = z.input<typeof emailsInputSchema>;
export type CreateEmail = z.input<typeof createEmailBodySchema>;
export type UpdateEmail = z.input<typeof updateEmailBodySchema>;
export type EmailFormValues = z.infer<typeof emailFormSchema>;

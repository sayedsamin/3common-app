import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api-client';
import * as c from './contracts';
import { pageIdSchema, assetsResponseSchema } from './schemas';
async function request<T>(path: string, schema: z.ZodType<T>, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
 const result = schema.safeParse(await apiRequest(path, { method, signal, ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }));
 if (!result.success) throw new ApiError('response', 'The page response could not be read. Refresh before retrying.'); return result.data;
}
function encoded(value: string) { return encodeURIComponent(pageIdSchema.parse(value)); }
export function getPages(input: z.input<typeof c.pagesInputSchema> = {}, signal?: AbortSignal) { const values = c.pagesInputSchema.parse({page: 0, pageSize: 50, ...input}); const params = new URLSearchParams(); Object.entries(values).forEach(([key,value]) => { if(value !== undefined) params.set(key,String(value)); }); return request('pages/?'+params,c.pagesResponseSchema,'GET',undefined,signal); }
export async function getPage(pageId: string, signal?: AbortSignal) { const result = await request('pages/'+encoded(pageId),c.pageResponseSchema,'GET',undefined,signal); if(result.data.id !== pageId) throw new ApiError('response','The page could not be read.'); return result.data; }
export function getImages(page = 0, signal?: AbortSignal) { z.number().int().min(0).parse(page); return request('assets/images/?page='+page+'&pageSize=50',assetsResponseSchema,'GET',undefined,signal); }
export function createPage(input: z.input<typeof c.createPageBodySchema>) { return request(`pages/`, c.createPageResponseSchema, 'POST', c.createPageBodySchema.parse(input)); }
export function updatePage(pageId: string, input: z.input<typeof c.updatePageBodySchema>) { const id = encoded(pageId); return request(`pages/${id}`, c.updatePageResponseSchema, 'PATCH', c.updatePageBodySchema.parse(input)); }
export function duplicatePage(pageId: string, input: z.input<typeof c.duplicatePageBodySchema>) { const id = encoded(pageId); return request(`pages/${id}/duplicate`, c.duplicatePageResponseSchema, 'POST', c.duplicatePageBodySchema.parse(input)); }
export function addElement(pageId: string, input: z.input<typeof c.addElementBodySchema>) { const id = encoded(pageId); return request(`pages/${id}/elements`, c.addElementResponseSchema, 'POST', c.addElementBodySchema.parse(input)); }
export function updateElement(pageId: string, targetId: string, input: z.input<typeof c.updateElementBodySchema>) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/elements/${childId}`, c.updateElementResponseSchema, 'PATCH', c.updateElementBodySchema.parse(input)); }
export function deleteElement(pageId: string, targetId: string) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/elements/${childId}`, c.deleteElementResponseSchema, 'DELETE'); }
export function layout(pageId: string, targetId: string, input: z.input<typeof c.layoutBodySchema>) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/elements/${childId}/layout`, c.layoutResponseSchema, 'PATCH', c.layoutBodySchema.parse(input)); }
export function addSection(pageId: string, input: z.input<typeof c.addSectionBodySchema>) { const id = encoded(pageId); return request(`pages/${id}/sections`, c.addSectionResponseSchema, 'POST', c.addSectionBodySchema.parse(input)); }
export function updateSection(pageId: string, targetId: string, input: z.input<typeof c.updateSectionBodySchema>) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/sections/${childId}`, c.updateSectionResponseSchema, 'PATCH', c.updateSectionBodySchema.parse(input)); }
export function deleteSection(pageId: string, targetId: string) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/sections/${childId}`, c.deleteSectionResponseSchema, 'DELETE'); }
export function positionSection(pageId: string, targetId: string, input: z.input<typeof c.positionSectionBodySchema>) { const id = encoded(pageId); const childId = encoded(targetId); return request(`pages/${id}/sections/${childId}/position`, c.positionSectionResponseSchema, 'PUT', c.positionSectionBodySchema.parse(input)); }

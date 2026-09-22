// Regenerate with node scripts/generate-marketing-contracts.cjs after updating API docs.
const fs = require('fs');
function generate(name, operations) {
 const doc=JSON.parse(fs.readFileSync('api-docs/docs.'+name+'.json','utf8')); const lines=[];const memo=new Map();
 function expr(s={}) {
  if(s.$ref) return 'z.lazy(() => '+s.$ref.split('/').pop()+')';
  if (Array.isArray(s.type)) return 'z.union(['+s.type.map(type => expr({...s,type})).join(', ')+'])';
  let e;
  if(s.enum) e=s.enum.length===1?'z.literal('+JSON.stringify(s.enum[0])+')':'z.union(['+s.enum.map(v=>'z.literal('+JSON.stringify(v)+')').join(', ')+'])';
  else if(s.oneOf||s.anyOf) e='z.union(['+(s.oneOf||s.anyOf).map(expr).join(', ')+'])';
  else if(s.type==='object') {const p=Object.entries(s.properties||{}).map(([k,v])=>JSON.stringify(k)+': '+expr(v)+(s.required?.includes(k)?'':'.optional()'));e=p.length?'z.object({ '+p.join(', ')+' })':s.additionalProperties&&typeof s.additionalProperties==='object'?'z.record(z.string(), '+expr(s.additionalProperties)+')':'z.object({})'; if(p.length&&s.additionalProperties&&typeof s.additionalProperties==='object')e+='.catchall('+expr(s.additionalProperties)+')';}
  else if(s.type==='array') {e='z.array('+expr(s.items)+')';if(s.minItems!==undefined)e+='.min('+s.minItems+')';if(s.maxItems!==undefined)e+='.max('+s.maxItems+')';}
  else if(s.type==='string') {e=s.format==='date-time'?'z.iso.datetime()':'z.string()';if(s.minLength!==undefined)e+='.min('+s.minLength+')';if(s.maxLength!==undefined)e+='.max('+s.maxLength+')';if(s.pattern&&s.format!=='date-time')e+='.regex(new RegExp('+JSON.stringify(s.pattern)+'))';}
  else if(s.type==='number'||s.type==='integer'){e='z.number()';if(s.type==='integer')e+='.int()';if(s.minimum!==undefined)e+=(s.exclusiveMinimum===true?'.gt(':'.min(')+s.minimum+')';else if(typeof s.exclusiveMinimum==='number')e+='.gt('+s.exclusiveMinimum+')';if(s.maximum!==undefined)e+='.max('+s.maximum+')';}
  else if(s.type==='null')e='z.null()';
  else if(s.type==='boolean')e='z.boolean()';else e='z.unknown()';
  if(s.nullable&&!s.enum?.includes(null))e+='.nullable()';
  if(e.length<110)return e; if(memo.has(e))return memo.get(e);const key='shape'+memo.size;memo.set(e,key);lines.push('const '+key+' = '+e+';');return key;
 }
 const refs=[];for(const[k,v]of Object.entries(doc.components?.schemas||{}))refs.push('const '+k+': z.ZodType<z.infer<ReturnType<typeof z.json>>> = '+expr(v)+';');
 const exports=[];
 for(const [label,path,method]of operations){const o=doc.paths[path][method];const body=o.requestBody?.content?.['application/json']?.schema;if(body)exports.push('export const '+label+'BodySchema = '+expr(body)+';');const response=Object.entries(o.responses).find(([s])=>s.startsWith('2'))[1].content['application/json'].schema;exports.push('export const '+label+'ResponseSchema = '+expr(response)+';');const params=o.parameters?.filter(p=>p.in==='query');if(params?.length)exports.push('export const '+label+'InputSchema = '+expr({type:'object',properties:Object.fromEntries(params.map(p=>[p.name,p.schema])),required:params.filter(p=>p.required).map(p=>p.name)})+';');}
 const dir='src/modules/'+(name==='email'?'emails':name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/contracts.ts','// Generated from api-docs/docs.'+name+'.json. Do not edit by hand.\nimport { z } from \'zod\';\n\n'+lines.join('\n')+'\n'+refs.join('\n')+'\n'+exports.join('\n')+'\n');
}
generate('email', [['emails','/v1/email/','get'],['createEmail','/v1/email/','post'],['email','/v1/email/{id}','get'],['updateEmail','/v1/email/{id}','patch'],['deleteEmail','/v1/email/{id}','delete'],['sendEmail','/v1/email/{id}/send','post'],['scheduleEmail','/v1/email/{id}/schedule','post'],['cancelSchedule','/v1/email/{id}/cancel-schedule','post'],['emailEvents','/v1/email/{id}/events','get'],['emailActivity','/v1/email/{id}/activity','get']]);
generate('pages',[['pages','/v1/pages/','get'],['createPage','/v1/pages/','post'],['page','/v1/pages/{pageId}','get'],['updatePage','/v1/pages/{pageId}','patch'],['duplicatePage','/v1/pages/{pageId}/duplicate','post'],['addElement','/v1/pages/{pageId}/elements','post'],['updateElement','/v1/pages/{pageId}/elements/{elementId}','patch'],['deleteElement','/v1/pages/{pageId}/elements/{elementId}','delete'],['layout','/v1/pages/{pageId}/elements/{elementId}/layout','patch'],['addSection','/v1/pages/{pageId}/sections','post'],['updateSection','/v1/pages/{pageId}/sections/{sectionId}','patch'],['deleteSection','/v1/pages/{pageId}/sections/{sectionId}','delete'],['positionSection','/v1/pages/{pageId}/sections/{sectionId}/position','put']]);

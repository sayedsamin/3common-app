import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const methods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

function operations(document) {
  return Object.values(document.paths).flatMap((path) =>
    Object.entries(path).filter(([key]) => methods.has(key)).map(([, value]) => value),
  );
}

// Exported so extraction can also be used without writing a file.
export function extractTags(document, requestedTags) {
  const available = [...new Set(operations(document).flatMap((operation) => operation.tags ?? []))];
  const tagsByName = new Map(available.map((tag) => [tag.toLowerCase(), tag]));
  const selected = new Set();

  if (requestedTags.length === 0) {
    throw new Error('Provide at least one tag name. Quote names containing spaces.');
  }

  for (const input of requestedTags) {
    const tag = tagsByName.get(input.trim().toLowerCase());
    if (!tag) {
      throw new Error(`Unknown tag: ${JSON.stringify(input)}. Available tags: ${available.join(', ')}`);
    }
    selected.add(tag);
  }

  const paths = {};
  for (const [path, item] of Object.entries(document.paths)) {
    const matching = Object.entries(item).filter(([key, operation]) =>
      methods.has(key) && operation.tags?.some((tag) => selected.has(tag)),
    );
    if (matching.length > 0) {
      // Retain shared parameters, servers, and other path-level metadata.
      paths[path] = Object.fromEntries([
        ...Object.entries(item).filter(([key]) => !methods.has(key)),
        ...matching,
      ]);
    }
  }

  const result = {
    ...document,
    paths,
    tags: [...selected].map((name) => document.tags?.find((tag) => tag.name === name) ?? { name }),
    components: {},
  };
  const included = new Set();

  function includeReference(reference) {
    if (!reference.startsWith('#/')) {
      throw new Error(`Cannot create a self-contained file from external reference: ${reference}`);
    }
    const segments = decodeURIComponent(reference.slice(2))
      .split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let target = document;
    for (const segment of segments) {
      if (!target || typeof target !== 'object' || !Object.hasOwn(target, segment)) {
        throw new Error(`Unresolved reference: ${reference}`);
      }
      target = target[segment];
    }

    if (segments[0] !== 'components' || segments.length < 3) {
      throw new Error(`Expected a component reference: ${reference}`);
    }
    const [, category, name] = segments;
    const id = JSON.stringify([category, name]);
    if (included.has(id)) return;
    included.add(id); // Mark before traversal to support recursive schemas.
    const component = document.components[category][name];
    if (!Object.hasOwn(result.components, category)) {
      Object.defineProperty(result.components, category, { value: {}, enumerable: true });
    }
    Object.defineProperty(result.components[category], name, { value: component, enumerable: true });
    visit(component);
  }

  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value.$ref === 'string') includeReference(value.$ref);
    // Security requirements refer to schemes by name rather than by $ref.
    if (Array.isArray(value.security)) {
      for (const requirement of value.security) {
        for (const name of Object.keys(requirement)) {
          includeReference(`#/components/securitySchemes/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`);
        }
      }
    }
    for (const reference of Object.values(value.discriminator?.mapping ?? {})) {
      includeReference(reference.startsWith('#/') ? reference :
        `#/components/schemas/${reference.replace(/~/g, '~0').replace(/\//g, '~1')}`);
    }
    Object.values(value).forEach(visit);
  }

  visit(result);
  if (Object.keys(result.components).length === 0) delete result.components;
  return result;
}

async function main() {
  const requestedTags = process.argv.slice(2);
  if (requestedTags.length === 0 || requestedTags.includes('--help')) {
    console.log('Usage: node api-docs/extract-tags.mjs <tag> [<tag> ...]');
    console.log('Example: node api-docs/extract-tags.mjs Events "Image Assets"');
    if (requestedTags.length === 0) process.exitCode = 1;
    return;
  }
  const document = JSON.parse(await readFile(new URL('./docs.json', import.meta.url), 'utf8'));
  const result = extractTags(document, requestedTags);
  const slug = result.tags.map(({ name }) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const filename = `docs.${slug.sort().join('+')}.json`;
  const output = new URL(filename, import.meta.url);
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Extracted ${result.tags.map(({ name }) => name).join(', ')}: ${operations(result).length} operations, ${Object.keys(result.components?.schemas ?? {}).length} shared schemas.`);
  console.log(`Written to ${fileURLToPath(output)}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

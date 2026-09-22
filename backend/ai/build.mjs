import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);

await build({
  absWorkingDir: fileURLToPath(new URL('.', import.meta.url)),
  entryPoints: ['handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/handler.js',
  // Shared contracts live under src/, but Lambda has its own dependency tree.
  // Resolve Zod here and avoid inheriting the Expo application's tsconfig.
  alias: { zod: require.resolve('zod') },
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
});

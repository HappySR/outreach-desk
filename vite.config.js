import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: { external: ['better-sqlite3'] },
  // The SQLite file changes on every save. Do not let the dev server react to it.
  server: { watch: { ignored: ['**/data/**'] } }
});

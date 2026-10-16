import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

// Explicitly include every static HTML page so the production build keeps the
// full multi-page VELTRION site, not only index.html.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        markets: resolve(root, 'markets.html'),
        platform: resolve(root, 'platform.html'),
        security: resolve(root, 'security.html'),
        login: resolve(root, 'login.html'),
        signup: resolve(root, 'signup.html'),
        account: resolve(root, 'account.html'),
        admin: resolve(root, 'admin.html'),
      },
    },
  },
});

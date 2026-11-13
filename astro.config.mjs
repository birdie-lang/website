import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { birdieGrammar } from './src/lib/birdie-grammar';

export default defineConfig({
  site: 'https://birdie.jakmaz.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      langs: [birdieGrammar],
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
  vite: { plugins: [tailwindcss()] },
});

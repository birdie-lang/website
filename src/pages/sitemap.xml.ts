import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { examples } from '../data/examples';
import { docHref } from '../lib/docs';

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Set the Astro site URL to generate the sitemap.');

  const docs = await getCollection('docs');
  const paths = [
    '/',
    '/examples',
    '/playground',
    ...docs.map(({ id }) => docHref(id)).sort(),
    ...examples.map(({ href }) => href).sort(),
  ];
  const entries = paths.map((path) => {
    const location = new URL(path, site).href.replaceAll('&', '&amp;').replaceAll("'", '&apos;');
    return `  <url><loc>${location}</loc></url>`;
  });

  return new Response([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

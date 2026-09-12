/// <reference types="vitest/config" />
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json'

export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === 'development'

  return {
    base: './',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  }
})

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: { index?: boolean }
  icons?: { icon?: string }
  openGraph?: { image?: string }
  analytics?: { googleAnalyticsId?: string }
  customScripts?: { headStart?: string; headEnd?: string; bodyStart?: string; bodyEnd?: string }
  accessibility?: { addBypassLinks?: boolean }
}

function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? 'PaperTrail'
  const language = 'en'

  return {
    name: 'figma-site-configuration',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', '')
        result = replaceHtmlCommentSlot(result, 'figma:head-end', '')
        result = replaceHtmlCommentSlot(result, 'figma:body-start', '')
        result = replaceHtmlCommentSlot(result, 'figma:body-end', '')
        return { html: result, tags: [] }
      },
    },
  }
}

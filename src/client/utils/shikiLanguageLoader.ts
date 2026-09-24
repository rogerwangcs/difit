import type { HighlighterCore } from 'shiki/core';

const loaded = new Set<string>();

const SHIKI_LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  fish: 'bash',
  yml: 'yaml',
  md: 'markdown',
  cs: 'csharp',
  proto: 'proto',
  tf: 'hcl',
  tfvars: 'hcl',
  dockerfile: 'docker',
  makefile: 'make',
  gitignore: 'bash',
  git: 'bash',
  pl: 'perl',
  pm: 'perl',
  sol: 'solidity',
  ex: 'elixir',
  exs: 'elixir',
  heex: 'elixir',
  hs: 'haskell',
  lhs: 'haskell',
  clj: 'clojure',
  cljs: 'clojure',
  cljc: 'clojure',
  edn: 'clojure',
  gd: 'gdscript',
  gvy: 'groovy',
  gy: 'groovy',
  gsh: 'groovy',
  gradle: 'groovy',
  vue: 'vue',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  env: 'bash',
  conf: 'nginx',
};

const SHIKI_LANGUAGE_IMPORTS: Record<string, () => Promise<unknown>> = {
  bash: () => import('@shikijs/langs/bash'),
  php: () => import('@shikijs/langs/php'),
  sql: () => import('@shikijs/langs/sql'),
  ruby: () => import('@shikijs/langs/ruby'),
  java: () => import('@shikijs/langs/java'),
  scala: () => import('@shikijs/langs/scala'),
  solidity: () => import('@shikijs/langs/solidity'),
  vim: () => import('@shikijs/langs/vim'),
  dart: () => import('@shikijs/langs/dart'),
  csharp: () => import('@shikijs/langs/csharp'),
  proto: () => import('@shikijs/langs/proto'),
  hcl: () => import('@shikijs/langs/hcl'),
  perl: () => import('@shikijs/langs/perl'),
  elixir: () => import('@shikijs/langs/elixir'),
  nix: () => import('@shikijs/langs/nix'),
  haskell: () => import('@shikijs/langs/haskell'),
  clojure: () => import('@shikijs/langs/clojure'),
  gdscript: () => import('@shikijs/langs/gdscript'),
  groovy: () => import('@shikijs/langs/groovy'),
  svelte: () => import('@shikijs/langs/svelte'),
  docker: () => import('@shikijs/langs/docker'),
  make: () => import('@shikijs/langs/make'),
  nginx: () => import('@shikijs/langs/nginx'),
  ini: () => import('@shikijs/langs/ini'),
  toml: () => import('@shikijs/langs/toml'),
  lua: () => import('@shikijs/langs/lua'),
  r: () => import('@shikijs/langs/r'),
  latex: () => import('@shikijs/langs/latex'),
  graphql: () => import('@shikijs/langs/graphql'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  swift: () => import('@shikijs/langs/swift'),
  rust: () => import('@shikijs/langs/rust'),
  go: () => import('@shikijs/langs/go'),
  cpp: () => import('@shikijs/langs/cpp'),
  c: () => import('@shikijs/langs/c'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  sass: () => import('@shikijs/langs/sass'),
  less: () => import('@shikijs/langs/less'),
  html: () => import('@shikijs/langs/html'),
  xml: () => import('@shikijs/langs/xml'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  markdown: () => import('@shikijs/langs/markdown'),
  python: () => import('@shikijs/langs/python'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  vue: () => import('@shikijs/langs/vue'),
};

const BUNDLED_LANGUAGES = new Set([
  'text',
  'plaintext',
  'markup',
  'html',
  'xml',
  'svg',
  'javascript',
  'js',
  'typescript',
  'ts',
  'jsx',
  'tsx',
  'css',
  'c',
  'cpp',
  'swift',
  'kotlin',
  'rust',
  'go',
  'graphql',
  'yaml',
  'yml',
  'json',
  'markdown',
  'md',
  'python',
  'py',
]);

export function resolveShikiLanguage(lang: string): string {
  const normalized = lang.toLowerCase();
  return SHIKI_LANGUAGE_ALIASES[normalized] ?? normalized;
}

export function isBundledShikiLanguage(lang: string): boolean {
  return BUNDLED_LANGUAGES.has(resolveShikiLanguage(lang));
}

export async function loadShikiLanguage(
  highlighter: HighlighterCore,
  lang: string,
): Promise<string> {
  const resolved = resolveShikiLanguage(lang);
  if (resolved === 'text' || resolved === 'plaintext') {
    return 'text';
  }

  if (loaded.has(resolved) || highlighter.getLoadedLanguages().includes(resolved)) {
    loaded.add(resolved);
    return resolved;
  }

  const importFn = SHIKI_LANGUAGE_IMPORTS[resolved];
  if (!importFn) {
    throw new Error(`Unsupported language: ${lang}`);
  }

  const grammar = await importFn();
  await highlighter.loadLanguage(grammar as Parameters<HighlighterCore['loadLanguage']>[0]);
  loaded.add(resolved);
  return resolved;
}

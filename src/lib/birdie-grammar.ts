import type { ShikiConfig } from '@astrojs/markdown-remark';

// Display highlighting for the proposed syntax, not a parser or language specification.
export const birdieGrammar: NonNullable<ShikiConfig['langs']>[number] = {
  name: 'birdie',
  scopeName: 'source.birdie',
  repository: {},
  patterns: [
    { name: 'comment.line.number-sign.birdie', match: '#.*$' },
    {
      name: 'string.quoted.double.birdie',
      begin: '"',
      end: '"',
      patterns: [{ name: 'constant.character.escape.birdie', match: '\\\\.' }],
    },
    {
      name: 'string.quoted.single.birdie',
      begin: "'",
      end: "'",
      patterns: [{ name: 'constant.character.escape.birdie', match: '\\\\.' }],
    },
    {
      match: '\\b(fn)\\s+([a-zA-Z_][a-zA-Z0-9_]*)',
      captures: {
        1: { name: 'keyword.declaration.function.birdie' },
        2: { name: 'entity.name.function.birdie' },
      },
    },
    {
      match: '\\b(type)\\s+([a-zA-Z_][a-zA-Z0-9_]*)',
      captures: {
        1: { name: 'keyword.declaration.type.birdie' },
        2: { name: 'entity.name.type.birdie' },
      },
    },
    { name: 'support.function.birdie', match: '\\b(swap|min|max)!(?=\\s*\\()' },
    { name: 'keyword.other.birdie', match: '\\bouter\\b' },
    { name: 'variable.language.birdie', match: '\\bself\\b' },
    { name: 'keyword.control.birdie', match: '\\breturn\\?' },
    { name: 'keyword.control.birdie', match: '\\b(return|for|in|if|else|while|repeat|continue|not|and|or|until|through|step|reverse)\\b' },
    { name: 'storage.type.birdie', match: '\\b(int|number|bool|str|char)\\b' },
    { name: 'storage.type.birdie', match: '\\b(list|map|counter|set|stack|queue|iterator)(?=\\s*\\[)' },
    { name: 'storage.type.birdie', match: '\\b[A-Z][a-zA-Z0-9_]*\\b' },
    { name: 'constant.language.birdie', match: '\\b(true|false|none)\\b' },
    { name: 'support.function.birdie', match: '\\b(list|map|counter|set|stack|queue|min|max|abs|zip|all|any)\\b' },
    { name: 'variable.other.property.birdie', match: '(?<=\\.)code\\b' },
    { name: 'constant.numeric.birdie', match: '\\b(inf|[0-9]+)\\b' },
    { name: 'keyword.operator.birdie', match: '//=|[+*-]=|//|==|!=|<=|>=|[?+*/=<>-]' },
  ],
};

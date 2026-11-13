// Display highlighting for the proposed syntax, not a parser or language specification.
export const birdieGrammar = {
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
    { name: 'keyword.control.birdie', match: '\\b(return|for|in|if|else|while|not|or)\\b' },
    { name: 'storage.type.birdie', match: '\\b(int|bool|str|char)\\b' },
    { name: 'constant.language.birdie', match: '\\b(true|false)\\b' },
    { name: 'support.function.birdie', match: '\\b(map|stack)\\b' },
    { name: 'constant.numeric.birdie', match: '\\b[0-9]+\\b' },
    { name: 'keyword.operator.birdie', match: '//|==|!=|<=|>=|[+*/=<>-]' },
  ],
};

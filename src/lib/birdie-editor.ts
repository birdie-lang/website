import { HighlightStyle, indentUnit, StreamLanguage, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { highlightTree, tags } from '@lezer/highlight';

const indentation = '    ';

const birdie = StreamLanguage.define({
  name: 'birdie',
  startState: () => ({ indentation: 0, opensBlock: false }),
  languageData: { commentTokens: { line: '#' } },
  indent: (state) => state.indentation + (state.opensBlock ? indentation.length : 0),
  token(stream, state) {
    if (stream.sol()) {
      state.indentation = stream.indentation();
      state.opensBlock = false;
    }
    if (stream.eatSpace()) return null;
    if (stream.eat('#')) {
      stream.skipToEnd();
      return 'comment';
    }

    state.opensBlock = Boolean(stream.eat(':'));
    if (state.opensBlock) return 'punctuation';
    if (stream.match(/^(?:"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?)/)) return 'string';
    if (stream.match(/^(?:fn|type|if|else|for|in|while|repeat|return|continue|outer|until|through|step|reverse)\b/)) return 'keyword';
    if (stream.match(/^(?:int|number|bool|str|char)\b/)) return 'typeName';
    if (stream.match(/^(?:true|false|none|inf)\b/)) return 'atom';
    if (stream.match(/^\d+/)) return 'number';
    if (stream.match(/^(?:and\b|or\b|not\b|[+*/=<>!?-])/)) return 'operator';
    if (stream.match(/^[a-zA-Z_]\w*(?=\s*\()/)) return 'variableName.function';
    if (stream.match(/^[a-zA-Z_]\w*/)) return null;
    stream.next();
    return null;
  },
});

const highlighting = HighlightStyle.define([
  { tag: [tags.keyword, tags.operator], class: 'birdie-keyword' },
  { tag: [tags.atom, tags.number, tags.typeName], class: 'birdie-literal' },
  { tag: tags.string, class: 'birdie-string' },
  { tag: tags.function(tags.variableName), class: 'birdie-function' },
  { tag: tags.comment, class: 'birdie-comment' },
]);

export const birdieEditorLanguage = [birdie, indentUnit.of(indentation), syntaxHighlighting(highlighting)];

// The initial preview uses the same tokens and styles as the live editor.
export function highlightBirdie(source: string) {
  const state = EditorState.create({ doc: source, extensions: birdie });
  const tokens: { text: string; className?: string }[] = [];
  let cursor = 0;
  highlightTree(syntaxTree(state), highlighting, (from, to, className) => {
    if (cursor < from) tokens.push({ text: source.slice(cursor, from) });
    tokens.push({ text: source.slice(from, to), className });
    cursor = to;
  });
  if (cursor < source.length) tokens.push({ text: source.slice(cursor) });
  return tokens;
}

import { HighlightStyle, indentUnit, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

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
  { tag: [tags.keyword, tags.operator], color: 'var(--accent)' },
  { tag: [tags.atom, tags.number, tags.typeName], color: 'var(--syntax-literal)' },
  { tag: tags.string, color: 'var(--syntax-string)' },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-function)' },
  { tag: tags.comment, color: 'var(--muted)' },
]);

export const birdieEditorLanguage = [birdie, indentUnit.of(indentation), syntaxHighlighting(highlighting)];

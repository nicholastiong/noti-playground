/**
 * A deliberately small syntax highlighter.
 *
 * The code shown is authored by us, not arbitrary input, so a single tokenizing
 * pass over a known vocabulary is enough — and unlike chained `replace` calls it
 * cannot match inside the markup it has already emitted.
 */

export type TokenKind = 'plain' | 'keyword' | 'binding' | 'call' | 'number' | 'punct' | 'comment';

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS =
  /\b(?:function|const|let|if|else|return|for|of|while|continue|break|new|null|Infinity|true|false)\b/;

const TOKEN = new RegExp(
  [
    `(${KEYWORDS.source})`,
    // Types and the names we bind at the top of each algorithm.
    '(\\b(?:Set|Map|MinQueue|Infinity|solutions|queens|cols|diagA|diagB|dist|prev|done|queue|graph|source|target)\\b)',
    // Anything invoked.
    '(\\b[A-Za-z_$][\\w$]*\\b(?=\\())',
    '(\\b\\d+\\b)',
    '([{}()\\[\\];,.|=<>+\\-*!&?:]+)',
  ].join('|'),
  'g',
);

const KINDS: TokenKind[] = ['keyword', 'binding', 'call', 'number', 'punct'];

/** Split one line of source into tokens. Trailing `//` comments are kept whole. */
export function tokenize(line: string): Token[] {
  const at = line.indexOf('//');
  const code = at >= 0 ? line.slice(0, at) : line;
  const comment = at >= 0 ? line.slice(at) : '';
  const out: Token[] = [];

  let last = 0;
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(code)) !== null) {
    if (match.index > last) out.push({ kind: 'plain', text: code.slice(last, match.index) });
    const kind = KINDS[match.findIndex((group, i) => i > 0 && group !== undefined) - 1] ?? 'plain';
    out.push({ kind, text: match[0] });
    last = TOKEN.lastIndex;
  }
  if (last < code.length) out.push({ kind: 'plain', text: code.slice(last) });
  if (comment) out.push({ kind: 'comment', text: comment });

  return out;
}

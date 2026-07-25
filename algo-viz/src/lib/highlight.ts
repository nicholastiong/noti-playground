/**
 * A deliberately small syntax highlighter.
 *
 * The code shown is authored by us, not arbitrary input, so a single tokenizing
 * pass over a known vocabulary is enough — and unlike chained `replace` calls it
 * cannot match inside the markup it has already emitted.
 */

export type Lang = 'js' | 'py';

export type TokenKind = 'plain' | 'keyword' | 'binding' | 'call' | 'number' | 'punct' | 'comment';

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS: Record<Lang, string> = {
  js: '\\b(?:function|class|this|const|let|if|else|return|for|of|while|continue|break|new|null|undefined|Infinity|true|false)\\b',
  py: '\\b(?:def|import|if|elif|else|return|for|in|is|not|and|or|while|continue|break|None|True|False)\\b',
};

const COMMENT: Record<Lang, string> = { js: '//', py: '#' };

const buildToken = (keywords: string) =>
  new RegExp(
    [
      `(${keywords})`,
      // Types and the names we bind at the top of each algorithm.
      '(\\b(?:Set|Map|MinQueue|Infinity|heapq|solutions|queens|cols|diagA|diagB|diag_a|diag_b|dist|prev|done|queue|heap|graph|source|target)\\b)',
      // Anything invoked.
      '(\\b[A-Za-z_$][\\w$]*\\b(?=\\())',
      '(\\b\\d+\\b)',
      '([{}()\\[\\];,.|=<>+\\-*!&?:]+)',
    ].join('|'),
    'g',
  );

const TOKEN: Record<Lang, RegExp> = { js: buildToken(KEYWORDS.js), py: buildToken(KEYWORDS.py) };

const KINDS: TokenKind[] = ['keyword', 'binding', 'call', 'number', 'punct'];

/** Split one line of source into tokens. Trailing comments are kept whole. */
export function tokenize(line: string, lang: Lang = 'js'): Token[] {
  const at = line.indexOf(COMMENT[lang]);
  const code = at >= 0 ? line.slice(0, at) : line;
  const comment = at >= 0 ? line.slice(at) : '';
  const out: Token[] = [];
  const token = TOKEN[lang];

  let last = 0;
  token.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(code)) !== null) {
    if (match.index > last) out.push({ kind: 'plain', text: code.slice(last, match.index) });
    const kind = KINDS[match.findIndex((group, i) => i > 0 && group !== undefined) - 1] ?? 'plain';
    out.push({ kind, text: match[0] });
    last = token.lastIndex;
  }
  if (last < code.length) out.push({ kind: 'plain', text: code.slice(last) });
  if (comment) out.push({ kind: 'comment', text: comment });

  return out;
}

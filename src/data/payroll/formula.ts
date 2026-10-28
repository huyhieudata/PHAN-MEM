export class FormulaError extends Error {}

type Node =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; l: Node; r: Node }
  | { t: 'pct'; v: Node }
  | { t: 'neg'; v: Node }
  | { t: 'call'; name: string; args: Node[] };

const FNS = new Set(['MAX', 'MIN', 'ROUND', 'TAX5']);

export function evaluateFormula(source: string, scope: Record<string, number | string>): number {
  const text = source.trim().replace(/^=/, '');
  if (!text) return 0;
  const parser = new Parser(text);
  const node = parser.parseExpr();
  if (parser.peek()) throw new FormulaError('Công thức còn ký tự chưa đọc được.');
  const value = evalNode(node, scope);
  return Number.isFinite(value) ? value : 0;
}

export function formulaRefs(source: string): string[] {
  const found = new Set<string>();
  const text = source.trim().replace(/^=/, '');
  if (!text) return [];
  try {
    walk(new Parser(text).parseExpr(), found);
  } catch {
    return [];
  }
  return [...found];
}

function walk(node: Node, found: Set<string>) {
  if (node.t === 'id') found.add(node.v);
  else if (node.t === 'bin') { walk(node.l, found); walk(node.r, found); }
  else if (node.t === 'pct' || node.t === 'neg') walk(node.v, found);
  else if (node.t === 'call') node.args.forEach(arg => walk(arg, found));
}

function evalNode(node: Node, scope: Record<string, number | string>): number {
  if (node.t === 'num') return node.v;
  if (node.t === 'id') return asNumber(scope[node.v]);
  if (node.t === 'neg') return -evalNode(node.v, scope);
  if (node.t === 'pct') return evalNode(node.v, scope) / 100;
  if (node.t === 'bin') {
    const l = evalNode(node.l, scope);
    const r = evalNode(node.r, scope);
    if (node.op === '+') return l + r;
    if (node.op === '-') return l - r;
    if (node.op === '*') return l * r;
    return r === 0 ? 0 : l / r;
  }
  const args = node.args.map(arg => evalNode(arg, scope));
  if (node.name === 'MAX') return Math.max(...args);
  if (node.name === 'MIN') return Math.min(...args);
  if (node.name === 'ROUND') return roundTo(args[0] ?? 0, args[1] ?? 0);
  if (node.name === 'TAX5') return taxFiveBrackets(args[0] ?? 0);
  throw new FormulaError('Hàm chưa được hỗ trợ: ' + node.name);
}

function asNumber(value: number | string | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return 0;
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** Math.max(0, digits);
  return Math.round(value * factor) / factor;
}

/** Biểu thuế TNCN 5 bậc theo tháng, đơn vị đồng. */
export function taxFiveBrackets(income: number): number {
  const bands: [number, number][] = [
    [10_000_000, 0.05],
    [30_000_000, 0.1],
    [60_000_000, 0.2],
    [100_000_000, 0.3],
    [Number.POSITIVE_INFINITY, 0.35],
  ];
  let left = Math.max(0, income);
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of bands) {
    const span = Math.min(left, limit - prev);
    if (span > 0) {
      tax += span * rate;
      left -= span;
    }
    prev = limit;
    if (left <= 0) break;
  }
  return Math.round(tax);
}

class Parser {
  private i = 0;
  constructor(private readonly s: string) {}
  parseExpr(): Node {
    let node = this.parseTerm();
    while (this.op('+') || this.op('-')) {
      const op = this.s[this.i - 1] as '+' | '-';
      node = { t: 'bin', op, l: node, r: this.parseTerm() };
    }
    return node;
  }
  private parseTerm(): Node {
    let node = this.parseUnary();
    while (this.op('*') || this.op('/')) {
      const op = this.s[this.i - 1] as '*' | '/';
      node = { t: 'bin', op, l: node, r: this.parseUnary() };
    }
    return node;
  }
  private parseUnary(): Node {
    if (this.op('-')) return { t: 'neg', v: this.parseUnary() };
    if (this.op('+')) return this.parseUnary();
    return this.parsePostfix();
  }
  private parsePostfix(): Node {
    let node = this.parsePrimary();
    while (this.op('%')) node = { t: 'pct', v: node };
    return node;
  }
  private parsePrimary(): Node {
    this.skip();
    if (this.s[this.i] === '(') {
      this.i += 1;
      const node = this.parseExpr();
      if (!this.op(')')) throw new FormulaError('Thiếu dấu đóng ngoặc.');
      return node;
    }
    const id = this.readId();
    if (id) {
      this.skip();
      if (this.s[this.i] === '(') {
        const name = id.toUpperCase();
        if (!FNS.has(name)) throw new FormulaError('Hàm chưa được hỗ trợ: ' + id);
        this.i += 1;
        const args: Node[] = [];
        this.skip();
        if (this.s[this.i] !== ')') {
          args.push(this.parseExpr());
          while (this.op(',')) args.push(this.parseExpr());
        }
        if (!this.op(')')) throw new FormulaError('Thiếu dấu đóng ngoặc của hàm.');
        return { t: 'call', name, args };
      }
      return { t: 'id', v: id };
    }
    const num = this.readNum();
    if (num != null) return { t: 'num', v: num };
    throw new FormulaError('Không đọc được công thức tại vị trí ' + (this.i + 1) + '.');
  }
  private readId() {
    this.skip();
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.s.slice(this.i));
    if (!m) return '';
    this.i += m[0].length;
    return m[0];
  }
  private readNum() {
    this.skip();
    const m = /^\d+(\.\d+)?/.exec(this.s.slice(this.i));
    if (!m) return null;
    this.i += m[0].length;
    return Number(m[0]);
  }
  private op(ch: string) {
    this.skip();
    if (this.s[this.i] !== ch) return false;
    this.i += 1;
    return true;
  }
  private skip() { while (this.s[this.i] === ' ' || this.s[this.i] === '\n') this.i += 1; }
  peek() { this.skip(); return this.s[this.i] ?? ''; }
}

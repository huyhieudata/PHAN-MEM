import { useEffect, useMemo, useState } from 'react';
import { plain } from '../data/text';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({ rows, columns, filterKey, empty = 'Không có dữ liệu' }: {
  rows: T[];
  columns: Column<T>[];
  filterKey?: string;
  empty?: string;
}) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  useEffect(() => { setPage(1); }, [filterKey]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find(c => c.id === sort.id);
    if (!col?.sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : plain(String(va)).localeCompare(plain(String(vb)), 'vi');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages);
  const view = sorted.slice((current - 1) * size, current * size);
  const numbers = pageNumbers(current, pages);

  function toggle(id: string) {
    setSort(cur => (cur && cur.id === id ? { id, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }));
  }

  return (
    <>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.id} aria-sort={!sort || sort.id !== col.id ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending'}>
                  {col.sort
                    ? <button type="button" className="th-btn" onClick={() => toggle(col.id)}>{col.header}{sort?.id === col.id ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                    : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map(row => <tr key={row.id}>{columns.map(col => <td key={col.id}>{col.cell(row)}</td>)}</tr>)}
            {!view.length && <tr><td colSpan={Math.max(columns.length, 1)} className="center muted empty-cell">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span className="muted">Hiển thị {sorted.length ? (current - 1) * size + 1 : 0}-{Math.min(current * size, sorted.length)} / {rows.length} Bản ghi</span>
        <div className="grow" />
        <select value={size} aria-label="Số dòng mỗi trang" onChange={e => { setSize(Number(e.target.value)); setPage(1); }}>
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / trang</option>)}
        </select>
        <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Trang trước">‹</button>
        {numbers.map(n => <button type="button" key={n} className={n === current ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>)}
        <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Trang sau">›</button>
      </div>
    </>
  );
}

function pageNumbers(current: number, total: number): number[] {
  const end = Math.min(total, Math.max(current + 2, 5));
  const start = Math.max(1, end - 4);
  const list: number[] = [];
  for (let i = start; i <= Math.min(total, start + 4); i++) list.push(i);
  return list;
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { useConfirm, useToast } from '../../components/feedback';
import { StatusBadge } from '../../components/Person';
import { downloadText, contractsToCsv } from '../../data/csv';
import { contractPhase } from '../../data/derive';
import { hr } from '../../data/repositories';
import type { Contract } from '../../data/types';
import { fmtDate, fmtMoney, includesPlain } from '../../data/text';
import { ContractForm } from './editors';
import { useLabels } from './lookups';

const PHASES = ['Tất cả', 'Hiệu lực', 'Sắp hết hạn', 'Hết hạn', 'Chờ ký', 'Thanh lý'];

export default function ContractsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [phase, setPhase] = useState('Tất cả');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  const rows = useMemo(() => state.contracts.filter(c => {
    const label = contractPhase(c).label;
    if (phase !== 'Tất cả' && label !== phase) return false;
    const emp = employee(c.employeeId);
    return includesPlain([c.code, c.type, emp?.fullName ?? '', emp?.code ?? ''].join(' '), q);
  }), [state.contracts, phase, q, employee]);

  const columns: Column<Contract>[] = [
    { id: 'code', header: 'Mã HĐ', sort: c => c.code, cell: c => c.code },
    { id: 'emp', header: 'Nhân sự', sort: c => employee(c.employeeId)?.fullName ?? '', cell: c => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${c.employeeId}?tab=hop-dong`)}>{employee(c.employeeId)?.fullName ?? '—'}</button> },
    { id: 'type', header: 'Loại hợp đồng', sort: c => c.type, cell: c => c.type },
    { id: 'start', header: 'Hiệu lực', sort: c => c.startDate, cell: c => fmtDate(c.startDate) },
    { id: 'end', header: 'Hết hạn', sort: c => c.endDate, cell: c => c.endDate ? fmtDate(c.endDate) : 'Không thời hạn' },
    { id: 'salary', header: 'Lương', sort: c => c.salary, cell: c => fmtMoney(c.salary) },
    { id: 'st', header: 'Trạng thái', sort: c => contractPhase(c).label, cell: c => <StatusBadge value={contractPhase(c).label} /> },
    {
      id: 'act', header: '', cell: c => (
        <div className="row-actions">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(c)}>Sửa</button>
          <button className="btn-ghost btn-sm" onClick={() => void remove(c)}>Xóa</button>
        </div>
      ),
    },
  ];

  async function remove(contract: Contract) {
    const yes = await ask({ title: 'Xóa hợp đồng', message: `Xóa hợp đồng ${contract.code}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteContract(contract.id);
    toast('Đã xóa hợp đồng');
  }

  const soon = state.contracts.filter(c => contractPhase(c).label === 'Sắp hết hạn').length;

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="seg">{PHASES.map(item => <button key={item} className={phase === item ? 'on' : ''} onClick={() => setPhase(item)}>{item}</button>)}</div>
        <div className="in-search">🔍<input value={q} aria-label="Tìm hợp đồng" placeholder="Tìm theo mã, tên, loại" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <span className="status warn">{soon} sắp hết hạn</span>
        <button className="btn-ghost" onClick={() => downloadText('hop-dong.csv', contractsToCsv(rows, state))}>⤓ Export</button>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm hợp đồng</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={`${phase}|${q}`} />
      {open && <ContractForm onClose={() => setOpen(false)} />}
      {editing && <ContractForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

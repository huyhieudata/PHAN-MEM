import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Donut } from '../../components/Charts';
import { DataTable } from '../../components/DataTable';
import { Drawer, FilterPanel } from '../../components/Drawer';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { taskStore, useTasks } from '../../data/tasks/store';
import type { TaskItem } from '../../data/tasks/store';
import { USER } from '../../data/session';
import { fmtDate, includesPlain, todayISO } from '../../data/text';
import { useLabels } from '../hr/lookups';

export function TaskOverview() {
  const nav = useNavigate();
  const cards = [
    ['Cài đặt', 'Admin', 'Trạng thái, độ ưu tiên, cấu hình hiển thị', '/m/cong-viec/trang-thai'],
    ['Dự án', 'Quản lý', 'Tên, thành viên, giai đoạn Kanban, phân quyền', '/m/cong-viec/du-an'],
    ['Công việc', 'Quản lý/Nhân viên', 'Trạng thái, ưu tiên, người thực hiện, việc con', '/m/cong-viec/du-an'],
    ['Báo cáo công việc', 'Quản lý', 'Tiến độ theo dự án, theo thành viên, tỷ lệ hoàn thành', '/m/cong-viec/bao-cao'],
  ] as const;
  return <div className="feature-grid">{cards.map(([title, role, body, to]) => <article key={title} className="card"><span className="pill">{role}</span><h3>{title}</h3><p>{body}</p><button className="btn-primary" onClick={() => nav(to)}>{title === 'Cài đặt' ? 'Cài đặt công việc' : title === 'Dự án' ? 'Xem danh sách dự án' : title === 'Công việc' ? 'Xem công việc' : 'Xem báo cáo'}</button></article>)}</div>;
}

export function TaskReport() {
  const data = useTasks();
  const [filter, setFilter] = useState(false);
  const roots = data.tasks.filter(task => !task.parentId);
  const byStatus = data.statuses.map(status => ({ label: status.column, value: roots.filter(task => task.statusId === status.id).length }));
  const byPriority = [...data.priorities.map(priority => ({ label: priority.name, value: roots.filter(task => task.priorityId === priority.id).length })), { label: 'Không xác định', value: roots.filter(task => !task.priorityId).length }];
  const overdue = roots.filter(task => task.end && task.end < todayISO() && task.statusId !== 'st-done').length;
  const soon = roots.filter(task => task.end && task.end >= todayISO() && task.end <= addDays(7) && task.statusId !== 'st-done').length;
  return <div>
    <div className="toolbar"><button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button></div>
    <div className="kpis"><div className="kpi"><small>Tổng số công việc</small><b>{roots.length}</b></div><div className="kpi"><small>Đến hạn trong 7 ngày tới</small><b>{soon}</b></div><div className="kpi"><small>Công việc quá hạn</small><b>{overdue}</b></div></div>
    <div className="report-grid">
      <section className="card"><h3>Phân loại theo loại trạng thái</h3><Donut items={byStatus} /></section>
      <section className="card"><h3>Phân loại theo mức độ ưu tiên</h3><Donut items={byPriority} /></section>
      <section className="card"><h3>Theo trạng thái và dự án</h3><BarChart items={byStatus} /></section>
      <section className="card"><h3>Số lượng công việc hoàn thành theo dự án</h3><p>Chưa có thông tin</p></section>
      <section className="card"><h3>Tiến độ hoàn thành</h3><p>{roots.filter(task => task.statusId === 'st-done').length} / {roots.length}. Ngày / Tuần / Tháng / Năm</p></section>
      <section className="card"><h3>Quá hạn theo dự án</h3><BarChart items={data.projects.map(project => ({ label: project.name, value: roots.filter(task => task.projectId === project.id && task.end && task.end < todayISO() && task.statusId !== 'st-done').length }))} /></section>
    </div>
    {filter && <FilterPanel title="Tìm kiếm nâng cao" onClose={() => setFilter(false)} onClear={() => undefined}><Field label="Ngày tạo"><TextInput type="date" /></Field><Field label="Loại trạng thái"><Select>{data.statuses.map(s => <option key={s.id}>{s.name}</option>)}</Select></Field><Field label="Mức độ ưu tiên"><Select><option>Không xác định</option>{data.priorities.map(p => <option key={p.id}>{p.name}</option>)}</Select></Field><Field label="Dự án"><Select>{data.projects.map(p => <option key={p.id}>{p.name}</option>)}</Select></Field><Field label="Ngày hoàn thành"><TextInput type="date" /></Field></FilterPanel>}
  </div>;
}

export function ProjectBoard() {
  const data = useTasks();
  const labels = useLabels();
  const [projectId, setProjectId] = useState(data.projects[0]?.id || '');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'kanban' | 'list' | 'report'>('kanban');
  const [filter, setFilter] = useState(false);
  const [create, setCreate] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [drag, setDrag] = useState('');
  const tasks = data.tasks.filter(task => task.projectId === projectId && !task.parentId && includesPlain(task.title, q));
  const project = data.projects.find(item => item.id === projectId);
  return <div className="split" style={{ gridTemplateColumns: '220px 1fr' }}>
    <aside className="card pad-card">
      <h3>Dự án của tôi</h3>
      {data.projects.map(item => <button key={item.id} className={'sub-item' + (item.id === projectId ? ' active' : '')} onClick={() => setProjectId(item.id)}>{item.name}</button>)}
      {adding ? <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; setProjectId(taskStore.addProject(name.trim())); setName(''); setAdding(false); }}><TextInput autoFocus placeholder="Nhập tên dự án..." value={name} onChange={e => setName(e.target.value)} /></form> : <button className="btn-ghost" onClick={() => setAdding(true)}>+ Thêm dự án</button>}
      <p className="muted">Menu ⋮ của dự án không có mục trong ghi chú.</p>
    </aside>
    <div>
      <div className="toolbar"><h2>{project?.name}</h2><input className="control" placeholder="Tìm kiếm công việc" aria-label="Tìm công việc" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button><button className="btn-primary" onClick={() => setCreate(data.statuses[0]?.id || '')}>Thêm công việc</button></div>
      <div className="tabs-line"><button className={view === 'kanban' ? 'on' : ''} onClick={() => setView('kanban')}>Kanban</button><button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>Danh sách</button><button className={view === 'report' ? 'on' : ''} onClick={() => setView('report')}>Báo cáo</button></div>
      {view === 'kanban' && <div className="feature-grid">{data.statuses.map(status => {
        const cards = tasks.filter(task => task.statusId === status.id);
        return <section key={status.id} className="card" onDragOver={e => e.preventDefault()} onDrop={() => { if (drag) taskStore.updateTask(drag, { statusId: status.id }); setDrag(''); }}>
          <h3 style={{ color: status.color }}>{status.column} <span className="pill">{cards.length}</span> <button className="btn-ghost btn-sm" onClick={() => setCreate(status.id)}>+</button></h3>
          {!cards.length && <p>Chưa có công việc nào</p>}
          {cards.map(card => <article key={card.id} className="mini-card" draggable onDragStart={() => setDrag(card.id)} onClick={() => setOpen(card.id)}><b>{card.title}</b><div>{data.tasks.some(task => task.parentId === card.id) ? '☰' : ''} ⋮</div></article>)}
        </section>;
      })}</div>}
      {view === 'list' && <table className="tbl"><thead><tr><th>Tiêu đề</th><th>Người phụ trách</th><th>Trạng thái</th><th>Ưu tiên</th><th>Thời gian thực hiện</th><th>Chủ sở hữu</th><th>Người theo dõi</th><th>Hành động</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td><button className="link" onClick={() => setOpen(task.id)}>{task.title}</button>{data.tasks.filter(item => item.parentId === task.id).map(sub => <div key={sub.id}>↳ {sub.title}</div>)}</td><td>{labels.employee(task.assigneeId)?.fullName || 'No assignee'}</td><td><Select aria-label="Trạng thái" value={task.statusId} onChange={e => taskStore.updateTask(task.id, { statusId: e.target.value })}>{data.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></td><td><Select aria-label="Ưu tiên" value={task.priorityId} onChange={e => taskStore.updateTask(task.id, { priorityId: e.target.value })}><option value="">Chưa có</option>{data.priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></td><td>{task.start ? `${fmtDate(task.start)} - ${fmtDate(task.end)}` : '—'}</td><td>{task.owner}</td><td>{task.watchers.length ? task.watchers.join(', ') : 'Không có người theo dõi'}</td><td><button className="btn-danger btn-sm" aria-label="Xóa" onClick={() => taskStore.deleteTask(task.id)}>🗑</button></td></tr>)}</tbody></table>}
      {view === 'report' && <ProjectReport tasks={tasks} />}
      {filter && <FilterPanel title="Bộ lọc" onClose={() => setFilter(false)} onClear={() => setQ('')}><Field label="Ưu tiên"><Select><option>Chọn mức độ</option>{data.priorities.map(p => <option key={p.id}>{p.name}</option>)}</Select></Field><Field label="Người phụ trách"><Select><option>Chọn nhân viên</option>{labels.state.employees.map(emp => <option key={emp.id}>{emp.fullName}</option>)}</Select></Field><Field label="Thời gian thực hiện"><TextInput type="date" /></Field></FilterPanel>}
      {create && <TaskDrawer statusId={create} projectId={projectId} onClose={() => setCreate(null)} />}
      {open && <TaskDetail id={open} onClose={() => setOpen(null)} />}
      <p className="muted">Menu ⋮ trên thẻ Kanban không có mục trong ghi chú. Kéo thả đổi cột.</p>
    </div>
  </div>;
}

function ProjectReport({ tasks }: { tasks: TaskItem[] }) {
  const data = useTasks();
  const overdue = tasks.filter(task => task.end && task.end < todayISO() && task.statusId !== 'st-done').length;
  return <div><div className="kpis"><div className="kpi"><small>Tổng số trong dự án</small><b>{tasks.length}</b></div><div className="kpi"><small>Đến hạn 7 ngày</small><b>{tasks.filter(task => task.end && task.end >= todayISO() && task.end <= addDays(7)).length}</b></div><div className="kpi"><small>Quá hạn</small><b>{overdue}</b></div><div className="kpi"><small>Của bạn đến hạn</small><b>0</b></div><div className="kpi"><small>Của bạn quá hạn</small><b>0</b></div></div>
    <div className="report-grid"><section className="card"><h3>Trạng thái công việc</h3><Donut items={data.statuses.map(s => ({ label: s.column, value: tasks.filter(t => t.statusId === s.id).length }))} /></section><section className="card"><h3>Mức độ ưu tiên dự án</h3><Donut items={[{ label: 'Không xác định', value: tasks.filter(t => !t.priorityId).length }]} /></section></div></div>;
}

function TaskDrawer({ statusId, projectId, onClose }: { statusId: string; projectId: string; onClose: () => void }) {
  const data = useTasks();
  const labels = useLabels();
  const [title, setTitle] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [status, setStatus] = useState(statusId);
  const [assigneeId, setAssigneeId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  return <Drawer title="Thêm công việc" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary" onClick={() => { if (!title.trim()) return; taskStore.addTask({ projectId, title, statusId: status, priorityId, assigneeId, watchers: [], start, end, description, parentId: null }); onClose(); }}>Lưu</button></>}>
    <Field label="Tên công việc"><TextInput placeholder="Nhập tên công việc" value={title} onChange={e => setTitle(e.target.value)} /></Field>
    <Field label="Ưu tiên"><Select value={priorityId} onChange={e => setPriorityId(e.target.value)}><option value="">Không có mức độ ưu tiên</option>{data.priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
    <Field label="Trạng thái"><Select value={status} onChange={e => setStatus(e.target.value)}><option value="">Chọn trạng thái</option>{data.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
    <Field label="Người phụ trách"><Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}><option value="">Không có người thực hiện</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
    <Field label="Từ ngày"><TextInput type="date" value={start} onChange={e => setStart(e.target.value)} /></Field>
    <Field label="Đến ngày"><TextInput type="date" value={end} onChange={e => setEnd(e.target.value)} /></Field>
    <Field label="Mô tả"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field>
    <p>File: Không có file. Thêm file — loại file không được liệt kê.</p>
  </Drawer>;
}

function TaskDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useTasks();
  const labels = useLabels();
  const task = data.tasks.find(item => item.id === id);
  const [comment, setComment] = useState('');
  const [sub, setSub] = useState('');
  if (!task) return null;
  const children = data.tasks.filter(item => item.parentId === id);
  return <div className="modal-back" onMouseDown={onClose}><div className="modal wide" onMouseDown={e => e.stopPropagation()}>
    <header><b>{task.title}</b><button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button></header>
    <div className="body split">
      <div>
        <h3>Chi tiết</h3>
        <Field label="Ưu tiên"><Select value={task.priorityId} onChange={e => taskStore.updateTask(id, { priorityId: e.target.value })}><option value="">Không có mức độ ưu tiên</option>{data.priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Trạng thái"><Select value={task.statusId} onChange={e => taskStore.updateTask(id, { statusId: e.target.value })}>{data.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <p>Chủ sở hữu {task.owner}</p>
        <p>Người phụ trách {labels.employee(task.assigneeId)?.fullName || 'Không có người thực hiện'}</p>
        <p>Người theo dõi {task.watchers.length ? task.watchers.join(', ') : 'Không có người theo dõi'}</p>
        <p>Thời gian {task.start ? `${fmtDate(task.start)} – ${fmtDate(task.end)}` : 'Chọn khoảng thời gian...'}</p>
        <Field label="Mô tả"><TextArea value={task.description} onChange={e => taskStore.updateTask(id, { description: e.target.value })} /></Field>
        <h3>Công việc con</h3>
        {children.map(child => <p key={child.id}>{child.title}</p>)}
        <form onSubmit={e => { e.preventDefault(); if (!sub.trim()) return; taskStore.addTask({ projectId: task.projectId, title: sub.trim(), statusId: task.statusId, priorityId: '', assigneeId: '', watchers: [], start: '', end: '', description: '', parentId: id }); setSub(''); }}><TextInput placeholder="+ Thêm công việc con" value={sub} onChange={e => setSub(e.target.value)} /></form>
        <h3>File</h3><p>Kéo và thả file để tải lên. Hỗ trợ tải lên đơn lẻ hoặc nhiều file cùng lúc. Định dạng không được liệt kê.</p>
      </div>
      <div>
        <h3>Bình luận</h3>
        {task.comments.map((item, index) => <p key={index}><b>{item.author}</b> {item.text}</p>)}
        <TextArea placeholder="Viết bình luận..." value={comment} onChange={e => setComment(e.target.value)} />
        <button className="btn-primary" onClick={() => { if (!comment.trim()) return; taskStore.comment(id, comment.trim()); setComment(''); }}>Lưu</button>
      </div>
    </div>
  </div></div>;
}

export function StatusSettings() {
  const data = useTasks();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const rows = data.statuses.filter(item => includesPlain(item.name, q));
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm kiếm tên loại trạng thái" aria-label="Tìm trạng thái" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-primary" onClick={() => setOpen(true)}>THÊM MỚI</button></div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Loại trạng thái', cell: r => r.column + ' · ' + r.name }, { id: 'color', header: 'Màu sắc', cell: r => <i className="dot" style={{ background: r.color }} /> }, { id: 'act', header: 'Công việc', cell: r => <button className="btn-ghost btn-sm" onClick={() => taskStore.deleteStatus(r.id)}>Xóa</button> }]} />
    <p>1-{rows.length} của {data.statuses.length} Kết quả</p>
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); taskStore.saveStatus({ id: '', name, column: name, color }); setOpen(false); }}><header><b>Thêm mới loại trạng thái</b></header><div className="body"><Field label="Loại trạng thái" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Màu sắc" required><TextInput type="color" value={color} onChange={e => setColor(e.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

export function PrioritySettings() {
  const data = useTasks();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#c026d3');
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm kiếm tên mức độ ưu tiên" aria-label="Tìm ưu tiên" /><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button></div>
    <DataTable rows={data.priorities} columns={[{ id: 'name', header: 'Tên mức độ ưu tiên', cell: r => r.name }, { id: 'color', header: 'Màu sắc', cell: r => <i className="dot" style={{ background: r.color }} /> }, { id: 'act', header: 'Công việc', cell: r => <button className="btn-ghost btn-sm" onClick={() => taskStore.deletePriority(r.id)}>Xóa</button> }]} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); taskStore.savePriority({ id: '', name, color }); setOpen(false); }}><header><b>Thêm mới mức độ ưu tiên</b></header><div className="body"><Field label="Tên mức độ ưu tiên" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Màu sắc" required><TextInput type="color" value={color} onChange={e => setColor(e.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

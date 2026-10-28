export function personInitial(name: string): string {
  return name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '?';
}

export function PersonCell({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="person">
      <div className="av sm">{personInitial(name)}</div>
      <div><b>{name}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = toneOf(value);
  return <span className={'status ' + tone}>{value}</span>;
}

export function toneOf(value: string): string {
  if (['Đang làm việc', 'Hiệu lực', 'Đã duyệt', 'Hoạt động', 'Đủ'].includes(value)) return 'ok';
  if (['Tạm nghỉ', 'Sắp hết hạn', 'Chờ duyệt', 'Nháp', 'Thử việc', 'Thực tập'].includes(value)) return 'warn';
  if (['Chờ ký'].includes(value)) return 'info';
  if (['Thanh lý', 'Ngừng'].includes(value)) return 'muted';
  if (value.startsWith('Thiếu') || value.startsWith('Vượt')) return 'warn';
  return 'bad';
}

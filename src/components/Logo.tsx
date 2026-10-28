export default function Logo({ light }: { light?: boolean }) {
  return (
    <div className="logo">
      <svg width="30" height="30" viewBox="0 0 32 32"><rect rx="9" width="32" height="32" fill="#2563EB" /><path d="M9 9v14M23 9v14M9 16h14" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" /></svg>
      <span style={{ color: light ? '#fff' : undefined }}>HRM <b>Hub</b></span>
    </div>
  );
}

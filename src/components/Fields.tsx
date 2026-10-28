export function Field({ label, error, required, children, className }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={'field' + (className ? ' ' + className : '')}>
      <span>{label}{required && <em> *</em>}</span>
      {children}
      {error ? <small className="err">{error}</small> : <small className="err spacer" />}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="control" />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="control" rows={props.rows ?? 3} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="control" />;
}

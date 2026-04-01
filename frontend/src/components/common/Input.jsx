export default function Input({ label, className = '', ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${className}`} {...props} />
    </div>
  );
}

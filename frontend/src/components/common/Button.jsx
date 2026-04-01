export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = variant === 'icon' ? 'icon-btn' : 'submit-form-btn';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}

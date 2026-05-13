import { type InputHTMLAttributes, type SelectHTMLAttributes, forwardRef, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { LucideIcon, Search } from 'lucide-react';

// ─── Text Input ─────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  wrapperClassName = '',
  id,
  ...props
}, ref) => {
  const inputId = id || props.name || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-slate-800/80 border rounded-xl px-4 py-2.5
            text-sm text-white placeholder-slate-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/70 focus:ring-red-500/50 focus:border-red-400' : 'border-slate-600/60 hover:border-slate-500'}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// ─── Search Input ────────────────────────────────────────────────────────────────

interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  onSearch,
  onChange,
  className = '',
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onSearch?.(e.target.value);
  };

  return (
    <Input
      ref={ref}
      type="search"
      icon={Search}
      iconPosition="left"
      placeholder="Buscar..."
      className={`pl-9 pr-4 ${className}`}
      onChange={handleChange}
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

// ─── Select ─────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}, ref) => {
  const selectId = id || props.name || `select-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full bg-slate-800/80 border rounded-xl px-4 py-2.5
          text-sm text-white appearance-none cursor-pointer
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500/70 focus:ring-red-500/50 focus:border-red-400'
            : 'border-slate-600/60 hover:border-slate-500'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';

// ─── Checkbox ───────────────────────────────────────────────────────────────────

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  wrapperClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}, ref) => {
  const cbId = id || `cb-${Math.random().toString(36).slice(2)}`;

  return (
    <label
      htmlFor={cbId}
      className={`flex items-center gap-3 cursor-pointer select-none group ${wrapperClassName}`}
    >
      <input
        ref={ref}
        type="checkbox"
        id={cbId}
        className={`
          w-4.5 h-4.5 rounded-md border cursor-pointer
          appearance-none relative
          bg-slate-800/80 border-slate-600/60
          checked:bg-indigo-600 checked:border-indigo-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
          transition-all duration-150
          ${className}
        `}
        style={{ width: '18px', height: '18px' }}
        {...props}
      />
      {label && (
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

// ─── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}, ref) => {
  const taId = id || props.name || `ta-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={taId} className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        className={`
          w-full bg-slate-800/80 border rounded-xl px-4 py-2.5
          text-sm text-white placeholder-slate-500
          resize-y min-h-[80px]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/70 focus:ring-red-500/50 focus:border-red-400' : 'border-slate-600/60 hover:border-slate-500'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

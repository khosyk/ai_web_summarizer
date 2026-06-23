import type { ServiceLang } from '../privacyNotice';
import { SERVICE_LANGUAGES } from '../supportedLanguages';

interface Props {
  value: ServiceLang;
  onChange: (language: ServiceLang) => void;
  label?: string;
  id?: string;
  className?: string;
}

/** UI·요약 출력 언어 선택 드롭다운 */
export function LanguagePicker({
  value,
  onChange,
  label,
  id = 'ui-language',
  className = '',
}: Props) {
  return (
    <label htmlFor={id} className={`block space-y-1 ${className}`}>
      {label ? (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ServiceLang)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      >
        {SERVICE_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

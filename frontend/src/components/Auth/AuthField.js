// Input padronizado das telas de autenticação: label + campo, com estado de foco.
export default function AuthField({ label, type = "text", value, onChange, autoFocus, ...rest }) {
  return (
    <div className="mb-5 text-left">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-slate-200 bg-slate-50 text-[14.5px] text-slate-900 transition-colors focus:outline-none focus:border-[#1428A0] focus:bg-white focus:ring-[3px] focus:ring-[#1428A0]/10"
        {...rest}
      />
    </div>
  );
}

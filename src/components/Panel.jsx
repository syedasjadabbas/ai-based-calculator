export function Panel({ title, subtitle, children, actions, className = '' }) {
  return (
    <section className={`glass-card rounded-3xl p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-300">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
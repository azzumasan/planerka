export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-cyan mb-2">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-text-muted max-w-xl">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

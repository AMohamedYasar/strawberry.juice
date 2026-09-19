export default function SectionTitle({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-light tracking-widest text-white uppercase">{children}</h2>
      {subtitle && <p className="mt-4 text-brand-coral uppercase tracking-[0.2em] text-sm">{subtitle}</p>}
    </div>
  );
}

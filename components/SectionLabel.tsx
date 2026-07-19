export default function SectionLabel({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-3" id={id}>
      <p className="section-label">{children}</p>
      <div className="h-px flex-1 bg-gradient-to-r from-panel-edge to-transparent" />
    </div>
  );
}

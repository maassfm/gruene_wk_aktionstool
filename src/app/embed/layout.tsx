export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-white">{children}</div>;
}

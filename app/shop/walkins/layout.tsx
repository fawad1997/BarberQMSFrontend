// Special layout for TV display - no header or footer
export default function WalkInsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-black fixed inset-0 overflow-auto">
      {children}
    </div>
  );
} 
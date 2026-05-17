export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="h-dvh w-dvw">{children}</main>;
}

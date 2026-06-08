export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="mx-4 max-w-4xl py-4 sm:mx-auto sm:py-6">{children}</div>
    </div>
  );
}

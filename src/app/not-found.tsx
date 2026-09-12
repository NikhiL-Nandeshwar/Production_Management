import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="state">
      <h1>Page not found</h1>
      <Link href="/dashboard">Return to dashboard</Link>
    </main>
  );
}

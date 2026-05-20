// app/page.tsx
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Dashboard />
    </div>
  );
}

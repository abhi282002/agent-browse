import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { AuthCard } from '@/components/auth/AuthCard';
import { PlatformMetricsCard } from '@/components/landing/PlatformMetricsCard';
import { WorkflowShowcase } from '@/components/workflow/WorkflowShowcase';
import { Footer } from '@/components/Footer';
import { PageGridBackground } from '@/components/landing/PageGridBackground';

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-between">
      <PageGridBackground />
      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-4 sm:py-8">
          <HeroSection />

          <div id="sandbox-demo" className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pt-8 border-t border-zinc-200/80">
            <div className="xl:col-span-4 flex flex-col gap-6 order-2 xl:order-1">
              <AuthCard />
              <PlatformMetricsCard />
            </div>

            <div className="xl:col-span-8 order-1 xl:order-2">
              <WorkflowShowcase />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

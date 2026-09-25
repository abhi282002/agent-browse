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

        <main className="mx-auto w-full max-w-6xl my-5 flex-1 px-4 sm:px-6 py-2 sm:py-4">
          <HeroSection />

          {/* Section Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[11px] font-medium text-neutral-400 tracking-widest uppercase">
              Platform
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div
            id="sandbox-demo"
            className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start"
          >
            <div className="xl:col-span-4 flex flex-col gap-2 order-2 xl:order-1">
              <div id="auth">
                <AuthCard />
              </div>
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

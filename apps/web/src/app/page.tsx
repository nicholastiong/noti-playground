import { getApiBaseUrl } from "@/lib/config";

export default function Home() {
  const apiBaseUrl = getApiBaseUrl();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          noti-playground
        </p>
        <h1 className="text-4xl font-semibold text-slate-950">
          Backend system design lab
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-700">
          This Next.js app stays intentionally simple while the backend evolves
          through API design, service boundaries, persistence, queues, caching,
          and observability.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">API boundary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The frontend talks to the backend through an environment-configured
          base URL.
        </p>
        <code className="mt-4 block rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900">
          {apiBaseUrl}
        </code>
      </section>
    </main>
  );
}

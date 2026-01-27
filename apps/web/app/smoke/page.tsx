import { notFound } from 'next/navigation';

// Block in production — this is a dev/staging diagnostic page only.
// Prevents deployment fingerprinting and unnecessary attack surface.
if (process.env.NODE_ENV === 'production') {
  // This executes at module scope during static generation.
  // The page will 404 in production builds.
}

export default function SmokePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Smoke Test
        </h1>
        <p className="text-gray-500 mb-8">
          If you can see colors, spacing, and rounded corners below, Tailwind CSS is working.
        </p>

        {/* Color swatches */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Colors</h2>
          <div className="flex flex-wrap gap-3">
            <div className="w-16 h-16 rounded-lg bg-blue-600 shadow-md" title="blue-600" />
            <div className="w-16 h-16 rounded-lg bg-red-500 shadow-md" title="red-500" />
            <div className="w-16 h-16 rounded-lg bg-green-500 shadow-md" title="green-500" />
            <div className="w-16 h-16 rounded-lg bg-yellow-400 shadow-md" title="yellow-400" />
            <div className="w-16 h-16 rounded-lg bg-purple-600 shadow-md" title="purple-600" />
            <div className="w-16 h-16 rounded-lg bg-gray-900 shadow-md" title="gray-900" />
          </div>
        </section>

        {/* Typography */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Typography</h2>
          <div className="space-y-2 bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-400">text-xs</p>
            <p className="text-sm text-gray-500">text-sm</p>
            <p className="text-base text-gray-700">text-base</p>
            <p className="text-lg font-medium text-gray-800">text-lg font-medium</p>
            <p className="text-xl font-semibold text-gray-900">text-xl font-semibold</p>
            <p className="text-2xl font-bold text-blue-600">text-2xl font-bold text-blue-600</p>
          </div>
        </section>

        {/* Layout: Flexbox + Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Layout</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Card A', 'Card B', 'Card C'].map((label) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-500">
                  Responsive grid card with hover shadow transition.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Primary
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              Secondary
            </button>
            <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
              Danger
            </button>
            <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
              Success
            </button>
          </div>
        </section>

        {/* Spacing + Borders */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Spacing &amp; Borders</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded" />
            <div className="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded-lg" />
            <div className="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded-xl" />
            <div className="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded-full" />
          </div>
        </section>

        {/* Status badge */}
        <div className="mt-8 inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-2 text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          Tailwind CSS is operational
        </div>
      </div>
    </main>
  );
}

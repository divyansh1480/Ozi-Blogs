import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-pink-50 via-white to-pink-100 min-h-[88vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-pink-100 text-pink-600 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-5 sm:mb-6 tracking-wide">
              A place for ideas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-5 sm:mb-6">
              Write, share &{' '}
              <span className="text-pink-500">inspire</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-500 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto px-2 sm:px-0">
              Ozi BLogs is where great writing happens. Share your stories, discover ideas, and connect with readers around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link
                href="/auth/register"
                className="bg-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-pink-600 transition shadow-md shadow-pink-200"
              >
                Start writing for free
              </Link>
              <Link
                href="/blogs"
                className="bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base border border-gray-200 hover:border-pink-300 hover:text-pink-500 transition"
              >
                Explore blogs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Everything you need to write</h2>
            <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">A clean, powerful platform built for writers who care about their craft.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: '✍️', title: 'Rich Text Editor', desc: 'Write beautifully with our full-featured editor — headings, lists, quotes, code, and more.' },
              { icon: '👁️', title: 'Live Preview', desc: 'See exactly how your blog looks as you write it, before publishing to the world.' },
              { icon: '🌍', title: 'Instant Publishing', desc: 'Go from draft to published in one click. Share your post link with anyone, anywhere.' },
              { icon: '📊', title: 'View Analytics', desc: 'Track how many readers are discovering your content with built-in view counts.' },
              { icon: '🔒', title: 'Draft & Publish', desc: "Save privately as a draft, polish it up, and publish whenever you're ready." },
              { icon: '⚡', title: 'Fast & Minimal', desc: 'No clutter, no noise — just you, your words, and your readers.' },
            ].map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-5 sm:p-8 hover:shadow-md hover:bg-pink-50 transition group">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{f.icon}</div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-pink-500 to-pink-400 py-14 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to share your story?</h2>
          <p className="text-pink-100 text-sm sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
            Join thousands of writers who use Ozi BLogs to publish their ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/auth/register"
              className="bg-white text-pink-500 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 transition shadow-lg"
            >
              Create your account
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-white hover:text-pink-500 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="text-white font-bold text-xl">Ozi BLogs</span>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Ozi BLogs. Made with love for writers.</p>
          <div className="flex gap-5 text-sm text-gray-400">
            <Link href="/blogs" className="hover:text-white transition">Explore</Link>
            <Link href="/auth/register" className="hover:text-white transition">Sign Up</Link>
            <Link href="/auth/login" className="hover:text-white transition">Sign In</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}

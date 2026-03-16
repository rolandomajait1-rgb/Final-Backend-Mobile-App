import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section
      className="hero-background flex min-h-screen flex-col items-center justify-center text-white"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(18, 94, 124, 0.5), rgba(0, 0, 0, 0.7)), url(/images/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto max-w-7xl px-4 py-10 text-center">
        <div className="mb-6 flex flex-col items-center space-y-4 py-4">
          <img src="/images/logo.svg" alt="La Verdad Christian College Logo" className="h-auto w-48" />
          <img src="/images/la verdad herald.svg" alt="La Verdad Herald" className="h-auto w-96" />
          <p className="text-xl font-medium text-gray-300">
            The Official Higher Education Student Publication of La Verdad Christian College, Inc.
          </p>
        </div>
        <div className="flex justify-center space-x-2">
          <Link
            to="/login"
            className="px-10 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded shadow transition duration-150"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-10 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded shadow transition duration-150"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
}

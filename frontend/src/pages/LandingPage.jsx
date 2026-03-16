import React from 'react';
import LoginButton from '../components/LoginButton';
import SignUpButton from '../components/SignUpButton';
import bgImage from '../assets/images/bg.jpg';
import logo from '../assets/images/logo.svg';
import laVerdadHerald from '../assets/images/la verdad herald.svg';
import Welcome from '../components/Welcome';
import Footer from '../components/Footer';

import '../App.css';

import LatestArticleCard from '../components/LatestArticleCard';

// The main landing page component
function LandingPage() {
  // Define the hero background style object
  const heroStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(18, 94, 124, 0.5), rgba(0, 0, 0, 0.7)), url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <>
      <section
        className="flex min-h-screen flex-col items-center justify-center text-white"
        style={heroStyle}
      >
        <div className="container mx-auto max-w-8xl px-4 py-10 text-center">
          <div className="mb-6 flex flex-col items-center space-y-4 py-4">
            <img
              src={logo}
              alt="La Verdad Christian College Logo"
              className="h-auto w-80"
            />
            <img
              src={laVerdadHerald}
              alt="La Verdad Herald"
              className="h-auto w-130"
            />
            <p className="text-xl font-medium text-gray-300">
              The Official Higher Education Student Publication of La Verdad
              Christian College, Inc.
            </p>
          </div>
          <div className="flex justify-center space-x-2 scroll-px-40">
            <LoginButton />
            <SignUpButton />
          </div>
        </div>
      </section>

      <Welcome />

      <LatestArticleCard />

      <Footer />
    </>
  );
}

export default LandingPage;

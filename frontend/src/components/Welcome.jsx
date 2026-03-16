export default function Welcome() {
    return (
      // Use <section> for a distinct part of the page
      <section id="welcome" aria-labelledby="welcome-heading" className="py-20 flex items-center justify-center bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 id="welcome-heading" className="text-5xl font-bold py-6 text-cyan-900 mb-6 font-serif">
            Welcome to La Verdad Herald
          </h2>
          
          {/* Using space-y-4 to add margin between paragraphs */}
          <div className="text-gray-600 leading-relaxed space-y-4 text-4lg ">
            <p>
              La Verdad Herald is the official digital publication platform of La Verdad Christian College, Inc.,
              committed to delivering truth, integrity, and service to the LVCC community. We provide
              timely, accurate, and engaging news coverage of campus events, student achievements,
              academic milestones, and community stories.
            </p>
            <p>
              As a student-run publication, we provide a voice for the LVCC community, fostering dialogue,
              celebrating excellence, and promoting transparency. Stay informed with the latest news from
              your campus community.
            </p>
          </div>
        </div>
      </section>
    );
  }
import React from 'react';

const Quote: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Decorative quotes */}
          <div className="absolute -top-8 -left-4 text-6xl text-purple-300 opacity-30">"</div>
          <div className="absolute -bottom-8 -right-4 text-6xl text-blue-300 opacity-30">"</div>

          {/* Main quote */}
          <div className="relative z-10 text-center px-8 py-12">
            <p className="text-3xl md:text-5xl font-light text-white leading-relaxed mb-8">
              How lucky I am to have something that makes saying goodbye so hard.
            </p>
            <p className="text-lg md:text-xl text-purple-200 font-medium">
              — A.A. Milne
            </p>
          </div>

          {/* Personal note */}
          <div className="mt-12 text-center">
            <p className="text-lg md:text-xl text-blue-200 font-light italic">
              Thank you for being the kind of colleagues who made Monday mornings worth it.
            </p>
            <p className="mt-4 text-md text-purple-300">
              Here's to all the problems we solved, the late nights we powered through,
            </p>
            <p className="text-md text-purple-300">
              and the countless laughs in between.
            </p>
          </div>

          {/* Medallians count */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-6 py-3">
              <p className="text-purple-200">
                <span className="text-2xl font-bold text-white">1,133</span> connections made
              </p>
              <p className="text-sm text-blue-200">
                One unforgettable journey
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote;
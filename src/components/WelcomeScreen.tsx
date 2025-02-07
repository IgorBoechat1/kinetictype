import React from 'react';


type WelcomeProps = {
  onStart: () => void;
};

const WelcomeScreen: React.FC<WelcomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center">
      {/* Header */}
      <h1 className="flex text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-center justify-center tracking-wider border-b-4 border-white pb-2">
        Kinetic Typography App
      </h1>
      <p className="mt-4 text-lg sm:text-xl lg:text-2xl font-serif">
        Create Stunning Animations with NOISE
      </p>

      {/* Features Section */}
      <section className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-4xl mt-12">
        {/* Feature 1 */}
        <div className="flex flex-col items-center text-center border-2 border-white p-4">
          <i className="fas fa-microphone-alt text-4xl mb-4"></i>
          <h2 className="text-2xl font-serif  font-bold mb-2">Voice Input</h2>
          <p className="font-serif">
            Use your microphone to bring your words to life with dynamic animations.
          </p>
        </div>
        {/* Feature 2 */}
        <div className="flex flex-col items-center text-center border-2 border-white p-4">
          <i className="fas fa-waveform text-4xl mb-4"></i>
          <h2 className="text-2xl font-serif font-bold mb-2">Noise Animations</h2>
          <p className="font-serif">
            Transform sound into visual art with our noise animation feature.
          </p>
        </div>
        {/* Feature 3 */}
        <div className="flex flex-col items-center text-center border-2 border-white p-4">
          <i className="fas fa-font text-4xl mb-4"></i>
          <h2 className="text-2xl font-serif font-bold mb-2">Many Fonts</h2>
          <p className="font-serif">
            Enjoy the classic elegance of Bodoni and other fonts in your kinetic typography.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <div className="mt-12">
        <button
          onClick={onStart}
          className="px-8 py-3 border-2 border-white text-lg font-serif font-bold hover:bg-white hover:text-black transition duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;

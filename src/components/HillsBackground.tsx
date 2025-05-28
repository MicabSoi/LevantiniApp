// @cursor: Generate a React+TypeScript component named HillsBackground.
// It should render a full-width, responsive SVG background with two layered hills:
//   • Far hill: path="M0,200 C480,100 960,300 1440,180 L1440,0 0,0 Z", fill="#155e4a"
//   • Near hill: path="M0,240 C480,140 960,340 1440,220 L1440,0 0,0 Z", fill="#0f4f3f"
// The <svg> must use viewBox="0 0 1440 320" and preserveAspectRatio="none",
// and have tailwind classes "absolute inset-0 w-full h-full" so it sits behind your content.
// Export the component as default.

import React from 'react';

const HillsBackground: React.FC = () => {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      {/* Far hill */}
      <path
        d="M0,200 C480,100 960,300 1440,180 L1440,0 0,0 Z"
        fill="#155e4a"
      />
      {/* Near hill */}
      <path
        d="M0,240 C480,140 960,340 1440,220 L1440,0 0,0 Z"
        fill="#0f4f3f"
      />
    </svg>
  );
};

export default HillsBackground;

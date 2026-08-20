import React from 'react';
import Spline from '@splinetool/react-spline';

export const SplineHeroBackground: React.FC = () => {
  return (
    <div className="hero-spline absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-auto">
      <Spline
        scene="https://prod.spline.design/EeP4HuQ4y5VdyO96/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

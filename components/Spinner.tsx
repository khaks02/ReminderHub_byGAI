
import React from 'react';

const Spinner = ({ size = '8' }: { size?: string }) => {
  return (
    <div className={`w-${size} h-${size} border-4 border-primary border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default Spinner;

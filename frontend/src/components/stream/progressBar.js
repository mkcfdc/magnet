import React from 'react';
//import './css/progressBar.css';

const ProgressBar = ({ progress }) => {
  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
            Progress
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-indigo-600">
            {progress.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="filled-progress flex rounded bg-gray-200">
      <div
      style={{ width: `${progress.toFixed(2)}%` }}
      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
      >

      </div>
      </div>
    </div>
  );
};

export default ProgressBar;

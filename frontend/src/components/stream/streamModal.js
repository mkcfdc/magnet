import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';

const StreamModal = ({ streamLink, onClose }) => {
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(streamLink);
      alert('Stream link copied to clipboard for VLC!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
<div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
  <div className="flex items-center justify-center min-h-screen">
    <div className="fixed inset-0 bg-black bg-opacity-75" onClick={handleCloseModal}></div>
    <div className="bg-white p-4 rounded-md shadow-lg w-full max-w-screen-lg relative sm:w-full">
      <ReactPlayer
        url={streamLink}
        controls
        playing
        className="w-full h-full rounded-md"
      />
      <div className="mt-4 text-center">
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={handleCopyToClipboard}
        >
          Copy for VLC
        </button>
        <button
          className="mt-2 ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={handleCloseModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>
  );
};

StreamModal.propTypes = {
  streamLink: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StreamModal;

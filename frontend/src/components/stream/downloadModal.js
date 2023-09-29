import React, { useState, useEffect, useCallback } from 'react';
import ProgressBar from './progressBar'; // Create a ProgressBar component
import StreamModal from './streamModal'; // Import your StreamModal component

const DownloadModal = ({ transferId, torrentHash, onClose }) => {
  const [transferStatus, setTransferStatus] = useState(null);
  const [streamLink, setStreamLink] = useState(null); // State for storing stream link
  const [showStreamModal, setShowStreamModal] = useState(false); // State for showing stream modal

  useEffect(() => {
    const fetchTransferStatus = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_MPC_API + `/transfer/status/${transferId}`);
        const data = await response.json();
        setTransferStatus(data);

        if (data.status === 'finished') clearInterval(intervalId);
        if (data.status === 'finished' && !torrentHash) torrentHash = data.src.replace('magnet:?xt=urn:btih:', '');

        if (torrentHash) {
          const streamResponse = await fetch(process.env.REACT_APP_MPC_API + `/getStreamLink/${torrentHash}`);
          const streamData = await streamResponse.json();

          if (streamData.streamLink) {
            setStreamLink(streamData.streamLink);
          }
        }
      } catch (error) {
        console.error('Error fetching transfer status:', error);
      }
    };

    const intervalId = setInterval(fetchTransferStatus, 15000); // Poll every 15 seconds
    return () => clearInterval(intervalId); // Clean up the interval
  }, [transferId, torrentHash]);

  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCloseModall = () => {
    setShowStreamModal(false);
    setStreamLink('');
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-black bg-opacity-75 absolute inset-0"></div>
      <div className="bg-white p-4 rounded-md shadow-lg relative">
          <h2 className="text-lg font-semibold mb-2">Transfer Status</h2>
          {transferStatus ? (
            <>
              <p><strong>Name:</strong> {transferStatus.name}</p>
              <p><strong>Message:</strong> {transferStatus.message}</p>
              <p><strong>Status:</strong> {transferStatus.status}</p>
              <p><strong>Progress:</strong> {Math.round(transferStatus.progress * 100)}%</p>
              <ProgressBar progress={transferStatus.progress * 100} />

              {/* Render StreamModal if showStreamModal is true */}

      <div className="button-container">
      <button
        className="delete-button bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 flex items-center"
        style={{ backgroundColor: 'rgb(139, 0, 0)' }}
        onClick={async () => {
          try {
            const deleteResponse = await fetch(
              process.env.REACT_APP_BACKEND_API + `/transfer/delete/${transferId}`
            );
            const deleteData = await deleteResponse.json();

            if (deleteData.status === 'success') {
              // Close the modal upon successful deletion
              onClose();
            } else {
              console.error('Failed to delete transfer:', deleteData.error);
            }
          } catch (error) {
            console.error('Error deleting transfer:', error);
          }
        }}
      >
        <span className="mr-1">&#10008;</span> Delete
      </button>

      {streamLink && (
        <button
          className="stream-now-button bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 flex items-center"
          style={{ backgroundColor: 'rgb(0, 128, 0)' }}
          onClick={() => {
            setShowStreamModal(true);
          }}
        >
          <span className="mr-1">&#9658;</span> Stream
        </button>
      )}
    </div>
            </>
          ) : (
            <p>Loading transfer status...</p>
          )}
          <div className="mt-4 text-center">
            <button
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Render StreamModal if showStreamModal is true */}
      {showStreamModal && (
       <StreamModal streamLink={streamLink} onClose={handleCloseModall} />
      )}
    </>
  );
};

export default DownloadModal;

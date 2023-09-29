import React, { useState, useEffect, useRef, useCallback } from 'react';
import StreamModal from '../stream/streamModal';
import DownloadModal from '../stream/downloadModal';

const SearchResultItem = ({ name, hash, category }) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isHashCopied, setIsHashCopied] = useState(false);
  const dropdownRef = useRef(null);
  const isCategoryXXX = category === 'XXX';

  const [showModal, setShowModal] = useState(false);
  const [streamLink, setStreamLink] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [transferId, setTransferId] = useState('');

  const handleStreamClick = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MPC_API}/getStreamLink/${hash}`);
      const data = await response.json();

      if (data.streamLink) {
        setStreamLink(data.streamLink);
        setShowModal(true);
      } else if (data.status === 'success' && data.id) {
        setShowDownloadModal(true);
        setTransferId(data.id);
      }
    } catch (error) {
      console.error('Error fetching stream link:', error);
    }
  }, [hash]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setStreamLink('');
    setTransferId('');
    setShowDownloadModal(false);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    const magnetLink = `magnet:?xt=urn:btih:${hash}`;
    navigator.clipboard.writeText(magnetLink)
      .then(() => {
        setIsHashCopied(true);
        setTimeout(() => setIsHashCopied(false), 3000);
      })
      .catch((error) => {
        console.error('Failed to copy the hash to clipboard', error);
      });
  }, [hash]);

  const toggleDropdown = useCallback(() => {
    setOpenDropdownId((prevId) => (prevId === hash ? null : hash));
  }, [hash]);

  const closeDropdown = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setOpenDropdownId(null);
    }
  }, []);

  useEffect(() => {
    if (openDropdownId !== null) {
      document.addEventListener('click', closeDropdown);
    }

    return () => {
      document.removeEventListener('click', closeDropdown);
    };
  }, [openDropdownId, closeDropdown]);

  return (
    <li className="bg-white shadow-md rounded-lg p-4 mb-4" style={{ listStyleType: 'none' }}>
      <div className="flex justify-between items-center">
        <div className="w-10/12">{name}{' '}{isCategoryXXX && <span className="text-red-500">XXX</span>}</div>
        <div className="w-2/12 text-right relative dropdown-container" ref={dropdownRef}>
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded-md border border-blue-600 shadow-md transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105"
            type="button"
            onClick={toggleDropdown}
          >
            Options
          </button>
          {openDropdownId === hash && (
            <ul className="absolute space-y-2 bg-white text-gray-700 mt-2 py-2 w-40 border border-gray-300 rounded-md shadow-md right-0 z-10" style={{ listStyleType: 'none' }}>
              <li>
                <button
                  className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  type="button"
                  onClick={handleCopyToClipboard}
                >
                  Copy hash to clipboard
                </button>
              </li>
              <li>
                <button
                  className="stream-now-button mx-auto bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 flex items-center"
                  style={{ backgroundColor: 'rgb(0, 128, 0)' }}
                  onClick={handleStreamClick}
                >
                  <span className="mr-1">&#9658;</span> Stream
                </button>
              </li>
            </ul>
          )}
        </div>
        {showModal && (
          <StreamModal streamLink={streamLink} onClose={handleCloseModal} />
        )}
        {showDownloadModal && (
          <DownloadModal transferId={transferId} torrentHash={hash} onClose={handleCloseModal} />
        )}
      </div>
      {isHashCopied && (
        <div className="mt-2 p-2 bg-green-500 text-white rounded-md">
          Hash copied to clipboard: {hash}
        </div>
      )}
    </li>
  );
};

export default SearchResultItem;

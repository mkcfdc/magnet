// src/App.js

import React from 'react';
import './App.css';
import SearchResults from './components/search/SearchResults';

function App() {
  return (
    <div className="App">
      <SearchResults />
      <div className="footer">
        <p>
          <a href="https://api.magnet.directory/createApiKey.html"> Create API Key </a>
          <a href="https://api.magnet.directory/"> API Documentation </a>
          <a href="https://github.com/your-username/your-repo"> Download this Source on GitHub </a>
        </p>
      </div>
    </div>
  );
}

export default App;
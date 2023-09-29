import React, { useState, useEffect } from 'react';
import SearchResultItem from './SearchResultItem';
import axios from 'axios';
import debounce from 'lodash/debounce';

const DEBOUNCE_TIME = 500;
const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

const categories = ["movies", "tv", "anime", "xxx"];

const SearchResults = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Trigger search here or leave it to the debounced function
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prevSelectedCategories) => {
      if (prevSelectedCategories.includes(category)) {
        return prevSelectedCategories.filter((c) => c !== category);
      } else {
        return [...prevSelectedCategories, category];
      }
    });
  };

  const fetchSearchResults = async (searchTerm, selectedCategories) => {
    try {
      setIsLoading(true);
      const categoryQuery = selectedCategories.join(',');

      const response = await axios.get(
        `${API_URL}/search?query=${searchTerm}&category=${categoryQuery}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      setResults(response.data.result);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  const debouncedSearch = debounce(fetchSearchResults, DEBOUNCE_TIME);

  useEffect(() => {
    debouncedSearch(searchTerm, selectedCategories);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, selectedCategories]);

  return (
    <div className="search-container">
      <div className="mx-auto">
        <h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6 inline-block align-text-bottom"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 2c1.124 0 2 .895 2 2s-.876 2-2 2-2-.895-2-2 .876-2 2-2zM12 6C7.582 6 4 9.582 4 14v5a1 1 0 001 1h14a1 1 0 001-1v-5c0-4.418-3.582-8-8-8z"
            ></path>
          </svg>{' '}
          Magnet Directory
        </h1>
      </div>
      <div className="search-box">
        <form id="searchForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              id="searchTerm"
              name="searchTerm"
              placeholder="Search"
              required
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path d="M21.71 20.29l-6.3-6.3a8.46 8.46 0 1 0-1.41 1.41l6.3 6.3a1 1 0 0 0 1.42-1.42z" />
            </svg>
          </div>
          <div>
            {categories.map((category) => (
              <div key={category} className="custom-checkbox">
                <input
                  type="checkbox"
                  name="categories[]"
                  value={category}
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                />
                <div className="checkmark"></div>
                <label htmlFor={category}>{category.toUpperCase()}</label>
              </div>
            ))}
          </div>
        </form>
      </div>

      <div className="results-container">
        {!isLoading && (
          <div id="searchResults" className="container">
            {results.map((item) => (
              <SearchResultItem key={item.id} name={item.name} hash={item.hash} category={item.category} />
            ))}
          </div>
        )}
        {isLoading && (
          <div className="loader" style={{ textAlign: 'center', marginTop: '20px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

import React from 'react';
import '../App.css'; // or a dedicated Search.css if preferred

const Search = ({ searchQuery, setSearchQuery }) => {
  return (
    <>
      <input
      type="text"
      placeholder="🔍 Search folders and files"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="search-input"
    />
    </>
  );
};

export default Search;

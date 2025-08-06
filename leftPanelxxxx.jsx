import React, { useState } from 'react';
import { FaPlus, FaBars, FaTimes } from 'react-icons/fa';
import '../App.css';

const LeftPanel = ({
  handleCreateRootFolder,
  folderData,
  renderFolder,
  SearchComponent,
  searchQuery,
  setSearchQuery,
  isMobile,
  setSelectedDocument,
  archivefiles,
  setArchiveFiles,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Pass all root folders to renderFolder.
  // The filtering based on 'active' status will now happen inside renderFolder.
  const allRootFolders = Object.values(folderData);

  const renderedFolders = renderFolder(allRootFolders); // Pass all root folders as an array

  return (
    <>
      {/* Mobile-only menu toggle button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`left-panel ${isMenuOpen ? 'open' : ''}`}>
        {isMobile && (
          <div className='Archive-button'>
            <button
              className="Archive-btn"
              onClick={(e) => {
                e.stopPropagation();
                setArchiveFiles(!archivefiles);
                setSelectedDocument(null);
                console.log(`Archive button clicked ${archivefiles}`);
              }}
            >
              {archivefiles ? 'Un-Archive' : 'Show Archived'}
            </button>
          </div>
        )}

        <div
          style={{
            padding: '10px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          {!archivefiles && (
            <button
              className="create-root-folder-button"
              onClick={handleCreateRootFolder}
              title="Create Root Folder"
              style={{
                marginLeft: '10px',
                backgroundColor: 'rgb(88, 138, 158)',
                fontWeight: 'bolder',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              <FaPlus style={{ marginRight: '5px' }} /> Folder
            </button>
          )}
        </div>

        <div className="folder-tree-container">
          {renderedFolders && renderedFolders.props.children && renderedFolders.props.children.length > 0 ? (
            renderedFolders
          ) : (
            <div className='empty-folder-message'>Nothing to display here</div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeftPanel;
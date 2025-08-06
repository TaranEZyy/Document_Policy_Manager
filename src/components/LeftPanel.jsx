import React, { useState } from 'react';
import { FaPlus, FaBars, FaTimes } from 'react-icons/fa';
// import { fetchCurrentUser, clearUserInfo } from '../redux/slices/userSlice';
import { useSelector } from 'react-redux';
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
  archivedBoolean,
  setArchivedBoolean
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 🟡 Pass forceShowAll = true when archivefiles is true
  const renderedFolders = renderFolder(folderData, []);
   const { userInfo } = useSelector((state) => state.user);

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
          <div className='Archive-button' style={{justifyContent: 'flex-end'}}>
           <button
            className="Archive-btn"
            onClick={async (e) => {
              e.stopPropagation();
              setArchivedBoolean(!archivedBoolean);
              setSelectedDocument(null);
              // fetchFolderAndFileData();
            }}
          >
          {archivedBoolean ? <>Un-Archived</>:<>Archived</>}
          </button>
          </div>
        )}

     <div className='top-bar-container'>
  <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {!archivedBoolean && userInfo?.name === "Admin" && (
          <button
            className="create-root-folder-button"
            onClick={handleCreateRootFolder}
            title="Create Root Folder"
          >
            <FaPlus className="icon-margin" /> Folder
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

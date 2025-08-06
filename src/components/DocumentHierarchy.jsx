import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaFolder, FaPlus, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';
import Loader from "react-js-loader";
import Search from './Search';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import axiosInstance from '../api/axiosInstance'; // adjust path as needed
import { useSelector,useDispatch } from 'react-redux';
import {
  setFolderData,
  setExpandedPaths,
  setSelectedDocument,
  setAllFiles,
  setArchivedBoolean,
  setAllVersionsOfSelectedDocument,
  setCurrentFilePath,
} from '../redux/slices/documentSlice';

const DocumentHierarchy = () => {
  const dispatch = useDispatch();
     const { userInfo } = useSelector((state) => state.user);

  const folderData = useSelector(state => state.document.folderData);
  const expandedPaths = useSelector(state => state.document.expandedPaths);
  const selectedDocument = useSelector(state => state.document.selectedDocument);
  const allFiles = useSelector(state => state.document.allFiles);
  const archivedBoolean = useSelector(state => state.document.archivedBoolean);
  const allVersionsOfSelectedDocument = useSelector(state => state.document.allVersionsOfSelectedDocument);
  const currentFilePath = useSelector(state => state.document.currentFilePath);

  const [isLoading, setIsLoading] = useState(true);
  const fileInputRefs = useRef({});
  const [showModal, setShowModal] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPath, setUploadPath] = useState([]);
  const [uploadCode, setUploadCode] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [folderIdToRename, setFolderIdToRename] = useState(null);
  const [openMenuForFolderId, setOpenMenuForFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const breakpoint = 768;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  const apiBaseUrl = process.env.REACT_APP_API_URL;
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchFolderAndFileData();
  }, [archivedBoolean]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setOpenMenuForFolderId(null); // close the dropdown
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

const fetchFolderAndFileData = async () => {
  setIsLoading(true);
  try {
    const [foldersRes, filesRes] = await Promise.all([
      axiosInstance.get(`${apiBaseUrl}/folders/all`),
      axiosInstance.get(`${apiBaseUrl}/files/all`),
    ]);

    const nestedData = buildNestedStructure(foldersRes.data);
    dispatch(setFolderData(nestedData));

    const filteredFiles = filesRes.data.filter(file =>
      archivedBoolean ? file.ispresent === false : file.ispresent === true
    );
    dispatch(setAllFiles(filteredFiles));

    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setIsLoading(false);
  }
};


const buildNestedStructure = (folders) => {
  const folderMap = {};
  const rootFoldersArray = [];

  folders.forEach((folder) => {
    const shouldInclude = archivedBoolean ? !folder.active : folder.active;
    if (shouldInclude) {
      folderMap[folder.id] = { ...folder, subfolders: {}, childrenIds: [] };
    }
  });

  folders.forEach((folder) => {
    if (folderMap[folder.id]) {
      const currentFolder = folderMap[folder.id];
      if (folder.parent) {
        let parentId = typeof folder.parent === 'object' ? folder.parent.id : null;
        if (!parentId && typeof folder.parent === 'string') {
          const foundParent = Object.values(folderMap).find(f => f.name === folder.parent);
          parentId = foundParent?.id;
        }
        const parentFolder = folderMap[parentId];
        if (parentFolder) parentFolder.childrenIds.push(currentFolder.id);
        else rootFoldersArray.push(currentFolder);
      } else {
        rootFoldersArray.push(currentFolder);
      }
    }
  });

  const buildTree = (folderId) => {
    const folder = folderMap[folderId];
    if (!folder) return null;

    const nestedFolder = { ...folder, subfolders: {} };

    const sortedChildrenIds = folder.childrenIds.sort((a, b) =>
      folderMap[a]?.name.localeCompare(folderMap[b]?.name)
    );

    sortedChildrenIds.forEach(childId => {
      const childNode = buildTree(childId);
      if (childNode) {
        nestedFolder.subfolders[childNode.id] = childNode;
      }
    });

    delete nestedFolder.childrenIds;
    return nestedFolder;
  };

  return rootFoldersArray
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(rootFolder => buildTree(rootFolder.id))
    .filter(Boolean);
};

  const toggleExpand = (folderId) => {
    dispatch(setExpandedPaths({
      ...expandedPaths,
      [folderId]: !expandedPaths[folderId],
    }));
  };

  const handleDocumentClick = (doc, path) => {
    dispatch(setSelectedDocument(doc));
    const versions = allFiles.filter(file => file.fileName === doc.fileName && file.code === doc.code)
      .sort((a, b) => a.version - b.version);
    dispatch(setAllVersionsOfSelectedDocument(versions));
    const fullPathString = path.length > 0 ? path.join('  >  ') + ' > ' + doc.fileName : doc.fileName;
    dispatch(setCurrentFilePath(fullPathString));
  };

  const getFolderCodeFromPath = useCallback((path) => {
    let currentFolders = folderData;
    let targetFolder = null;
    for (let i = 0; i < path.length; i++) {
      const folderName = path[i];
      let foundInCurrentLevel = false;
      for (const folder of currentFolders) {
        if (folder.name === folderName) {
          if (i === path.length - 1) {
            targetFolder = folder;
            foundInCurrentLevel = true;
            break;
          } else {
            currentFolders = Object.values(folder.subfolders);
            foundInCurrentLevel = true;
            break;
          }
        }
      }
      if (!foundInCurrentLevel) return null;
    }
    return targetFolder ? targetFolder.code : null;
  }, [folderData]);


   // Handles file uploads to a specific folder
  const handleFileUpload = async (e, path, code) => {
  const file = e.target.files[0];
  if (!file) return;

  // Get the folder code for the current upload path
  const targetFolderCode = getFolderCodeFromPath(path);

  let fileExistsInFolder = false;

  // Only perform the 'some' check if allFiles is confirmed to be an array
  if (Array.isArray(allFiles)) {
    fileExistsInFolder = allFiles.some(
      (existingFile) =>
        existingFile.code === targetFolderCode && existingFile.fileName === file.name
    );
  } else {
    console.warn('allFiles is not an array. Assuming no existing files for initial upload check.');
  }



  if (fileExistsInFolder) {
    toast.error(`A file named "${file.name}" already exists in this folder. You cannot upload a file with the same name. Only you can update a new version of the file.`);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  if (!code) {
    console.error('Missing required code parameter');
    return;
  }
  formData.append('code', code);
  try {
    const response = await axiosInstance.post(
      `${apiBaseUrl}/files/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    toast.success('File uploaded successfully:');
    fetchFolderAndFileData(); // Refresh data after upload
  } catch (error) {
    if (error.response) {
      console.error('Upload error response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error during upload:', error.message);
    }
  }
};

  // Opens the modal for creating/renaming folders
  const openModal = (path) => {
    setNewFolderPath(path);
    setNewFolderName('');
    setShowModal(true);
  };

  // Closes the modal and resets related states
  const closeModal = () => {
    setShowModal(false);
    setNewFolderName('');
    setNewFolderPath([]);
    setIsRenaming(false);
    setFolderIdToRename(null);
  };


  // Creates a new folder
  const createFolder = () => {
    const randomCode = `code_${Math.random().toString(36).substring(2, 10)}`; // Generate a unique code for the new folder
    const payload = {
      name: newFolderName,
      code: randomCode,
      parent:
        newFolderPath.length > 0
          ? { name: newFolderPath[newFolderPath.length - 1] } // Set parent if creating a subfolder
          : null, // No parent if creating a root folder
      active: true, // New folders are always active initially
    };

    if (!newFolderName.trim()) {
      toast.warn('Folder name cannot be empty');
      return;
    }

    axiosInstance
      .post(`${apiBaseUrl}/folders/create`, payload)
      .then(() => {
        closeModal();
        fetchFolderAndFileData(); // Refresh data after creating folder
      })
      .catch((err) => {
        console.error('Error creating folder:', err);
      });
  };


  // Handler for creating a new subfolder
  const handleCreateFolder = (path) => {
    setIsRenaming(false);
    openModal(path);
  };

  // Handler for creating a new root folder
  const handleCreateRootFolder = () => {
    setIsRenaming(false);
    openModal([]);
  };

  // Filters files that belong to a specific folder code
  const getFilesForFolder = (folderCode) => {
    if (!folderCode || !Array.isArray(allFiles)) return [];
    // This function simply gets files associated with a folderCode.
    // The filtering based on 'active' status will happen in renderFolder.
    return allFiles.filter((file) => file.code === folderCode);
  };

  // Memoized function to check if any descendant (folder or file) matches the search query
  const doesAnyDescendantMatch = useCallback((currentFolderObj, query) => {
    // Check current folder name
    if (currentFolderObj.name.toLowerCase().includes(query)) {
        return true;
    }

    // Check files directly in current folder
    const currentFiles = getFilesForFolder(currentFolderObj.code);
    if (currentFiles.some(file => file.fileName.toLowerCase().includes(query))) {
        return true;
    }

    // Recursively check all subfolders for matches
    if (currentFolderObj.subfolders) {
        for (const subFolderName in currentFolderObj.subfolders) {
            const subFolder = currentFolderObj.subfolders[subFolderName];
            if (doesAnyDescendantMatch(subFolder, query)) {
                return true;
            }
        }
    }
    return false; // No match found in this branch
}, [allFiles]);

  useEffect(() => {
    if (searchQuery) {
      const newExpandedPaths = {};
      const lowerCaseSearchQuery = searchQuery.toLowerCase();

      // Recursive helper to find and mark paths for expansion based on search
      const findAndExpandMatches = (currentData, currentPath) => {
        let foundMatchInBranch = false;
        for (const [folderName, folderObj] of Object.entries(currentData)) {
          const fullPath = [...currentPath, folderName];
          const pathKey = fullPath.join('/');

          // Check if this folder or any of its descendants matches the query
          if (doesAnyDescendantMatch(folderObj, lowerCaseSearchQuery)) {
            newExpandedPaths[pathKey] = true;
            foundMatchInBranch = true;
            // Also ensure parent paths are expanded for visibility
            let tempPath = [];
            for(let i = 0; i < fullPath.length; i++) {
                tempPath.push(fullPath[i]);
                newExpandedPaths[tempPath.join('/')] = true;
            }
          }

          // Recursively check subfolders regardless of current folder match for deeper matches
          if (folderObj.subfolders && Object.keys(folderObj.subfolders).length > 0) {
            if (findAndExpandMatches(folderObj.subfolders, fullPath)) {
                // If a sub-branch has a match, ensure this current folder is also expanded
                newExpandedPaths[pathKey] = true;
                foundMatchInBranch = true;
            }
          }
        }
        return foundMatchInBranch;
      };

      // Start the recursive expansion from the root folder data
      findAndExpandMatches(folderData, []);
     dispatch(setExpandedPaths(newExpandedPaths));

    } else {
      // When search query is empty, reset expanded paths
     dispatch(setExpandedPaths({}));

    }
  }, [searchQuery, folderData, doesAnyDescendantMatch]);


// ... (previous code)

 const renderFolder = (data, path = []) => {
  const lowerCaseSearchQuery = searchQuery.toLowerCase();

  // If data is not an array, return null or empty fragment
  if (!Array.isArray(data)) return null;

  return (
    <>
    <ul className="tree">
      {data.map((folderObj) => {
        const folderName = folderObj.name;
        const fullPath = [...path, folderName];
       const isOpen = expandedPaths[folderObj.id];


       if (!fileInputRefs.current[folderObj.id]) {
          fileInputRefs.current[folderObj.id] = React.createRef();
        }


        const filesForFolder = getFilesForFolder(folderObj.code);

        const shouldShowFolder =
          searchQuery === '' || doesAnyDescendantMatch(folderObj, lowerCaseSearchQuery);

        if (!shouldShowFolder) {
          return null;
        }

        return (
          <li key={folderObj.id}> {/* Use folderObj.id as the key for uniqueness */}
            <div
              className="folder-node"
             onClick={() => toggleExpand(folderObj.id)}
            >
                  <div className="folder-info">
                    <FaFolder className="folder-icon-yellow" />
                    {folderName}
                  </div>
              {!archivedBoolean &&  userInfo?.name === "Admin" &&  (
                <>
                  <button
                    className="icon-button"
                    title="Create Subfolder"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolder(fullPath);
                    }}
                  >
                    <FaPlus style={{ color: '#cccccc', fontSize: '1.0rem' }} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="icon-button"
                      title="More options"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openMenuForFolderId === folderObj.id) {
                          setOpenMenuForFolderId(null);
                        } else {
                          setOpenMenuForFolderId(folderObj.id);
                        }
                      }}
                    >
                      <FaEllipsisV style={{ color: '#cccccc', fontSize: '1.0rem' }} />
                    </button>
                    {openMenuForFolderId === folderObj.id && (
                      <div className="dropdown-menu" ref={dropdownRef}>
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRenaming(true);
                            setFolderIdToRename(folderObj.id);
                            setNewFolderName(folderObj.name);
                            setNewFolderPath(fullPath);
                            setShowModal(true);
                            setOpenMenuForFolderId(null);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadPath(fullPath);
                            const code = getFolderCodeFromPath(fullPath);
                            setUploadCode(code || '');
                            setSelectedFile(null);
                            setShowUploadModal(true);
                            setOpenMenuForFolderId(null);
                          }}
                        >
                          Upload File
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmDelete = window.confirm(
                              `Are you sure you want to delete the folder "${folderObj.name}"?`
                            );
                            if (confirmDelete) {
                              try {
                                await axiosInstance.delete(`${apiBaseUrl}/folders/${folderObj.id}`);
                                toast.success('Folder deleted successfully!');
                                setOpenMenuForFolderId(null);
                                dispatch(setSelectedDocument(null));
                                fetchFolderAndFileData();
                              } catch (error) {
                                console.error('Error deleting folder:', error);
                                toast.error('Failed to delete folder. It may contain files or subfolders.');
                              }
                            }
                          }}
                        >
                          Delete Folder
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {showUploadModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h2>Upload File to: /{uploadPath.join('/')}</h2>
                  <input
                    type="file"
                    multiple={true}
                    accept="application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <div className="modal-buttons">
                    <button
                      onClick={() => {
                        if (selectedFile) {
                          const syntheticEvent = {
                            target: {
                              files: [selectedFile],
                            },
                          };
                          handleFileUpload(syntheticEvent, uploadPath, uploadCode);
                          setShowUploadModal(false);
                        } else {
                          toast.warn('Please select a file first.');
                        }
                      }}
                    >
                      Submit
                    </button>
                    <button onClick={() => setShowUploadModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {isOpen && (
              <ul>
                {(() => {
                  const groupedFiles = {};
                  filesForFolder.forEach(doc => {
                    // This `shouldIncludeFile` check is already handling the active/archived status of the direct parent folder.
                    // If the folderObj itself is displayed (due to shouldShowFolder), its files should follow its active status.
                    // So, if archivedBoolean is true, only files from folderObj.active === false folders will be considered.
                    const shouldIncludeFile = archivedBoolean ? !folderObj.active : folderObj.active;
                    if (shouldIncludeFile) {
                      if (!groupedFiles[doc.fileName]) {
                        groupedFiles[doc.fileName] = [];
                      }
                      groupedFiles[doc.fileName].push(doc);
                    }
                  });

                  const filesToDisplay = Object.values(groupedFiles)
                    .map(versions => {
                      const v1 = versions.find(v => v.version === Infinity);
                      return v1 || versions.sort((a, b) => b.version - a.version)[0];
                    })
                    .filter(doc =>
                      searchQuery === '' || doc.fileName.toLowerCase().includes(lowerCaseSearchQuery)
                    );

                  return filesToDisplay.map((doc, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        className="pdf-item"
                        onClick={() => handleDocumentClick(doc, fullPath)}
                        style={{ flexGrow: 1, cursor: 'pointer' }}
                      >
                        📄 {doc.fileName}
                      </div>
                    </li>
                  ));
                })()}

                {/* Recursively render subfolders, passing subfolders as an array */}
               {folderObj.subfolders &&
                renderFolder(
                  Object.values(folderObj.subfolders).sort((a, b) => a.name.localeCompare(b.name)),
                  fullPath
                )}

              </ul>
            )}
          </li>
        );
      })}
    </ul>

{/* REVISED ARCHIVED ORPHANED FILES LOGIC */}
{archivedBoolean && path.length === 0 && (() => {
  // Helper to recursively find a folder by code in the current folderData structure
  const findFolderByCode = (folders, targetCode) => {
    for (const folder of folders) {
      if (folder.code === targetCode) {
        return folder;
      }
      const foundInSubfolders = findFolderByCode(Object.values(folder.subfolders), targetCode);
      if (foundInSubfolders) {
        return foundInSubfolders;
      }
    }
    return null;
  };

  const orphanedFiles = allFiles.filter((file) => {
    // A file is considered "orphaned" in the archived view if:
    // 1. It's an archived file (ispresent: false).
    // 2. Its direct parent folder (identified by file.code) does NOT exist within the currently
    //    rendered `folderData` structure (which only contains archived folders due to buildNestedStructure).
    // This implies that its parent or an ancestor folder was permanently deleted or is not considered archived.
    const isArchivedFile = file.ispresent === false;
    const directParentFolderInArchivedTree = findFolderByCode(folderData, file.code);

    // If the file is archived AND its direct parent folder is NOT found in the
    // currently built archived folder tree (folderData), then it's an "orphan".
    return isArchivedFile && !directParentFolderInArchivedTree;
  });

  const groupedByCode = {};
  orphanedFiles.forEach((file) => {
    if (!groupedByCode[file.code]) {
      groupedByCode[file.code] = [];
    }
    groupedByCode[file.code].push(file);
  });

  return (
    <ul className="tree">
      {Object.entries(groupedByCode).map(([code, files]) => {
        // Try to get a meaningful folder name from the file's frontendFilePath
        let folderName = files[0]?.frontendFilePath;
        if (!folderName) {
            // Fallback if frontendFilePath is missing
            folderName = `Orphaned_Folder_${code.substring(0, 8)}`;
        }
        const folderParts = folderName.split(/[\\/]/);
        const displayFolderName = folderParts.length > 1
          ? folderParts[folderParts.length - 2]
          : `Unknown Orphaned Folder`; // More descriptive for truly orphaned

        const isVirtualOpen = expandedPaths[`virtual-archived-${code}`];

        return (
     <li key={`virtual-archived-${code}`}>
  <div
    className="folder-node"
   onClick={() => toggleExpand(`virtual-archived-${code}`)}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
      <FaFolder style={{ color: 'white', fontSize: '1.3rem' }} /> 
      {displayFolderName} 
      {/* (Orphaned) */}
    </div>
  </div>

  {expandedPaths[`virtual-archived-${code}`] && (
    <ul className="tree">
      {(() => {
        const fileGroups = {};
        files.forEach(file => {
          const key = `${file.code}-${file.fileName}`;
          if (!fileGroups[key] || file.version > fileGroups[key].version) {
            fileGroups[key] = file;
          }
        });

        const uniqueFiles = Object.values(fileGroups);
        return uniqueFiles.map((doc, i) => (
          <li key={`${doc.code}-${i}`} className="tree-file-item">
            <div
              className="pdf-item"
              onClick={() => handleDocumentClick(doc, [displayFolderName])}
              style={{ flexGrow: 1, cursor: 'pointer' }}
            >
              📄 {doc.fileName}
            </div>
          </li>
        ));
      })()}
    </ul>
  )}
</li>

        );
      })}
    </ul>
  );
})()}
    </>
  );
};


  // ... rest of functions remain same, using dispatch where needed to update redux

 
  return (
    <div className={`document-hierarchy `}>

      {isLoading ? (
        <div className="loader-container">
          <Loader type="spinner-default" bgColor="#3498db" color="#3498db" size={100} />
        </div>
      ) : (
        <>
          <LeftPanel
          handleCreateRootFolder={handleCreateRootFolder}
          folderData={folderData}
          renderFolder={renderFolder}
          SearchComponent={Search}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isMobile={isMobile}
          // These values are now coming from Redux
          setSelectedDocument={(doc) => dispatch(setSelectedDocument(doc))}
          archivedBoolean={archivedBoolean}
          setArchivedBoolean={(val) => dispatch(setArchivedBoolean(val))}
        />

        <RightPanel
          setSelectedDocument={(doc) => dispatch(setSelectedDocument(doc))}
          selectedDocument={selectedDocument}
          fetchFolderAndFileData={fetchFolderAndFileData}
          apiBaseUrl={apiBaseUrl}
          currentFilePath={currentFilePath}
          isMobile={isMobile}
          folderData={folderData}
          allFiles={allFiles}
          allVersionsOfSelectedDocument={allVersionsOfSelectedDocument}
          handleDocumentClick={handleDocumentClick}
          archivedBoolean={archivedBoolean}
          setArchivedBoolean={(val) => dispatch(setArchivedBoolean(val))}
        />


          {/* Modal for creating/renaming folders */}

          {/* Modal for creating/renaming folders */}
          {showModal && (
            <div className="modal-overlay"
                 onClick={(e) => {
                // Only close if the click is directly on the overlay itself
                // This prevents clicks inside the modal content from closing it
                if (e.target.classList.contains('modal-overlay')) {
                  closeModal();
                }
              }}
              >

              <div className="modal-content">
                <h2>{isRenaming ? 'Rename Folder' : `Create Folder in: /${newFolderPath.join('/')}`}</h2>

                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  onKeyDown={(e) => { // This onKeyDown is on the INPUT FIELD
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Call the submission logic directly here as well
                      if (isRenaming) {
                        axiosInstance.patch(`${apiBaseUrl}/folders/${folderIdToRename}/name?newName=${encodeURIComponent(newFolderName)}`)
                          .then(() => {
                             toast.success('Folder renamed successfully!');
                            // fetchFolderAndFileData(); // Refresh data
                            closeModal();
                          })
                          .catch((error) => {
                            console.error('Error renaming folder:', error);
                            toast.error('Failed to rename folder.');
                          });
                      } else {
                        createFolder();
                      }
                    }
                  }}
                />
                <div className="modal-buttons">
                  <button
                    onClick={() => { // This onClick is on the BUTTON
                      if (isRenaming) {
                        axiosInstance.patch(`${apiBaseUrl}/folders/${folderIdToRename}/name?newName=${encodeURIComponent(newFolderName)}`)
                          .then(() => {
                             toast.success('Folder renamed successfully!');
                            fetchFolderAndFileData(); // Refresh data
                            closeModal();
                          })
                          .catch((error) => {
                            console.error('Error renaming folder:', error);
                            toast.error('Failed to rename folder.');
                          });
                      } else {
                        createFolder();
                      }
                    }}
                  >
                    {isRenaming ? 'Rename' : 'Create'}
                  </button>

                  <button onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </div>
          )}


          {/* Modal for multi-file upload */}
          {showUploadModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Upload Files to: /{uploadPath.join('/')}</h2>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => setSelectedFile(Array.from(e.target.files))}
                />
                <div className="modal-buttons">
                  <button
                    onClick={() => {
                      if (selectedFile && selectedFile.length > 0) {
                        selectedFile.forEach(file => {
                          const syntheticEvent = {
                            target: {
                              files: [file],
                            },
                          };
                          // Pass uploadPath (which is the full logical path) and uploadCode (the direct parent folder's code)
                          handleFileUpload(syntheticEvent, uploadPath, uploadCode);
                        });
                        setShowUploadModal(false);
                      } else {
                         toast.warn('Please select at least one file to upload.');
                      }
                    }}
                  >
                    Submit
                  </button>
                  <button onClick={() => setShowUploadModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentHierarchy;

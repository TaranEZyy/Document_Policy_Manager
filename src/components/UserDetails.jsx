// src/components/UserProfile.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, clearUserInfo } from '../redux/slices/userSlice';
import { FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
// import './UserProfile.css'; // Add this for styling

const UserProfile = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);

   useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const handleLogout = () => {
    toast.success("Logging out...");
    dispatch(clearUserInfo());

    setTimeout(() => {
      window.location.href = 'https://stgn.appsndevs.com/seasiaconnectfeqa/userdashboard';
    }, 100);
  };

  return (
    <div className="user-profile-container">
      <div className="user-profile">
        <div className="avatar">{userInfo?.name?.charAt(0).toUpperCase()}</div>

        <div className="user-details">
          <div className="name">{userInfo?.name}</div>
          <div className="dept">
            {userInfo?.department?.toUpperCase()} - <span className="sub-dept">{userInfo?.createdBy}</span>
          </div>
        </div>

        <div
          className="dropdown-wrapper"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <FaChevronDown className="dropdown-icon" />

          {showDropdown && (
            <button onClick={handleLogout} className="dropdown-menu">
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isHapticEnabled, setIsHapticEnabled] = useState(false);
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(false);

  const updateProfileImage = (newImage) => {
    setProfileImage(newImage);
  };

  const updateDisplayName = (name) => {
    setDisplayName(name);
  };

  const incrementUnreadNotifications = () => {
    setUnreadNotifications((prev) => prev + 1);
  };

  const resetUnreadNotifications = (value = 0) => {
    setUnreadNotifications(value);
  };

  return (
    <UserContext.Provider
      value={{
        profileImage,
        updateProfileImage,
        displayName,
        updateDisplayName,
        unreadNotifications,
        incrementUnreadNotifications,
        resetUnreadNotifications,
        isHapticEnabled,
        setIsHapticEnabled,
        areNotificationsEnabled,
        setAreNotificationsEnabled,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
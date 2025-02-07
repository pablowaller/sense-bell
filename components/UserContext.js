import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profileImage, setProfileImage] = useState(null); 
  const [displayName, setDisplayName] = useState(null); 

  const updateProfileImage = (newImage) => {
    setProfileImage(newImage);
  };

  const updateDisplayName = (name) => {
    setDisplayName(name);
  };
  

  return (
    <UserContext.Provider value={{ profileImage, updateProfileImage, displayName, updateDisplayName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
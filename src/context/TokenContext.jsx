import React, { createContext, useState, useEffect, useContext } from 'react';

const TokenContext = createContext();

export const useToken = () => useContext(TokenContext);

export const TokenProvider = ({ children }) => {
  const [token, setTokenState] = useState(localStorage.getItem('github_token') || null);

  const setToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('github_token', newToken);
      setTokenState(newToken);
    } else {
      clearToken();
    }
  };

  const clearToken = () => {
    localStorage.removeItem('github_token');
    setTokenState(null);
  };

  return (
    <TokenContext.Provider value={{ token, setToken, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
};

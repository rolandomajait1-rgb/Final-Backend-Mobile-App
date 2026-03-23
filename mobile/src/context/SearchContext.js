import React, { createContext, useState, useCallback } from 'react';

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const openSearchModal = useCallback(() => {
    setIsSearchModalVisible(true);
  }, []);

  const closeSearchModal = useCallback(() => {
    setIsSearchModalVisible(false);
  }, []);

  const value = {
    isSearchModalVisible,
    openSearchModal,
    closeSearchModal,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../api/client';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [libraries, setLibraries] = useState([]);
  const [connectors, setConnectors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [libData, connData] = await Promise.all([
          useApi('/v2/FileLibrary'),
          useApi('/v2/MangaConnector')
        ]);
        setLibraries(libData || []);
        setConnectors((connData || []).filter(c => c.enabled));
      } catch (error) {
        console.error('Failed to fetch cached data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ libraries, connectors }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
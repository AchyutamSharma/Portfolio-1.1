import { useEffect, useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

const STORAGE_KEY = 'portfolioAdminData';

const loadStoredPortfolio = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to read stored portfolio data:', error);
    return null;
  }
};

const saveStoredPortfolio = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save portfolio data locally:', error);
  }
};

const fetchPortfolioFromApi = async () => {
  try {
    const response = await fetchApi('/api/portfolio');
    const result = await response.json();
    if (response.ok && result.success && result.portfolio) {
      saveStoredPortfolio(result.portfolio);
      return result.portfolio;
    }
  } catch (error) {
    console.warn('Unable to fetch portfolio data from backend:', error);
  }
  return null;
};

export const usePortfolioData = () => {
  const [savedData, setSavedData] = useState(portfolioData);

  useEffect(() => {
    let active = true;

    const applyStoredData = () => {
      const storedData = loadStoredPortfolio();
      if (storedData && active) {
        setSavedData(storedData);
      }
    };

    const loadData = async () => {
      applyStoredData();
      const serverData = await fetchPortfolioFromApi();
      if (serverData && active) {
        setSavedData(serverData);
      }
    };

    loadData();
    const handleStorageEvent = (event) => {
      if (event.key === STORAGE_KEY) {
        applyStoredData();
      }
    };

    window.addEventListener('portfolioDataChanged', applyStoredData);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      active = false;
      window.removeEventListener('portfolioDataChanged', applyStoredData);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return savedData;
};

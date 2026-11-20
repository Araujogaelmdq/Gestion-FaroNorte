import React, { createContext, useContext, useEffect, useState } from 'react';
import { Club, ClubInput } from '@faronorte/shared';
import { getClub, updateClub } from '../services/configuracion';

interface ClubContextType {
  club: Club | null;
  loading: boolean;
  refreshClub: () => Promise<void>;
  updateClubData: (data: ClubInput) => Promise<Club>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClub = async () => {
    try {
      const data = await getClub();
      setClub(data);
    } catch (err) {
      console.error('Error al cargar datos del club:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClub();
  }, []);

  const updateClubData = async (data: ClubInput): Promise<Club> => {
    const updated = await updateClub(data);
    setClub(updated);
    return updated;
  };

  return (
    <ClubContext.Provider value={{ club, loading, refreshClub, updateClubData }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub debe usarse dentro de un ClubProvider');
  }
  return context;
};


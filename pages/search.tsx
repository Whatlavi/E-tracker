// En tu archivo: frontend/pages/search.tsx (o .js)

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios'; // Importamos Axios y AxiosError

// 🛑 FIX: Interfaz para tipar los datos que vienen del API
interface PlayerData {
  name: string;
  tagLine: string;
  puuid: string;
  summonerId: string;
  ranks: any[]; // Ajusta esto si tienes el tipo exacto para los ranks
  region: string;
}

const SearchPage = () => {
  const router = useRouter();
  
  // 🛑 FIX: Usamos la interfaz PlayerData | null para tipar correctamente
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función de búsqueda
  const fetchPlayerData = async (riotId: string, regionLoL: string) => {
      setLoading(true);
      setError(null);
      try {
          const res = await axios.get<PlayerData>(`/api/riot/player-data?riotId=${riotId}&regionLoL=${regionLoL}`);
          setPlayerData(res.data);
      } catch (err) { 
          // 🛑 FIX: Manejar el error de forma segura y tipada
          if (axios.isAxiosError(err) && err.response) {
              const apiErrorMessage = (err.response.data as {error?: string}).error;
              setError(apiErrorMessage || `Error ${err.response.status} de la API.`);
          } else if (err instanceof Error) {
              setError(err.message);
          } else {
              setError('Error desconocido al buscar datos.');
          }
          
          setPlayerData(null);
      } finally {
          setLoading(false);
      }
  };

  // 🛑 FIX CLAVE: Lógica de carga de datos que se ejecuta solo cuando el router está listo
  useEffect(() => {
    if (!router.isReady) {
      return; 
    }
    
    // Obtenemos los parámetros después de la verificación
    const { riotId, regionLoL } = router.query; 
    const defaultRegion = (regionLoL as string) || 'euw1';

    if (typeof riotId === 'string' && riotId.trim() !== '') {
        fetchPlayerData(riotId, defaultRegion);
    } else {
        setLoading(false);
        setPlayerData(null);
    }
    
  }, [router.isReady, router.query]); 
  // **************************************************

  // --- Renderizado de la Interfaz basado en estados ---
  // 🛑 FIX: Mostrar estado de carga si el router no está listo
  if (!router.isReady) {
    return <div>Cargando la aplicación...</div>; 
  }
  
  if (loading) {
    return <div>Buscando al invocador...</div>;
  }
  
  if (error) {
    return <div>Error al buscar: {error}</div>;
  }
  
  // 🛑 FIX: Asegurar que playerData no es null antes de intentar acceder a sus propiedades
  if (!playerData) {
      return <div>Introduce un Riot ID y Tagline para empezar la búsqueda.</div>;
  }

  return (
    <div>
        <h1>Resultados para {playerData.name}#{playerData.tagLine}</h1>
        {/* Aquí puedes usar todas las propiedades: playerData.puuid, playerData.ranks, etc. */}
    </div>
  );
};

export default SearchPage;
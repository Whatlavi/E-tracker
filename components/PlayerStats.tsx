"use client";
import { useEffect, useState } from "react";

// --- INTERFACES (Correctas) ---
interface SummonerData {
  id: string;
  name: string;
  puuid: string;
  summonerLevel: number;
}

interface LeagueStat {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface PlayerAPIResponse {
  summoner: SummonerData;
  stats?: LeagueStat[];
}

// 🛑 CORRECCIÓN: Ahora recibe la región como prop
interface PlayerStatsProps {
  username: string;
  region: string; // Añadimos la región
}

export default function PlayerStats({ username, region }: PlayerStatsProps) { // 🛑 Desestructuramos la región
  const [data, setData] = useState<PlayerAPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🛑 Ahora el fetch solo se ejecuta si tenemos ambos datos
    if (!username || !region) return;

    const fetchPlayer = async () => {
      setError(null);
      setData(null);
      setLoading(true);

      try {
        // 🛑 CORRECCIÓN: Usamos el endpoint de la API Route que creaste
        const res = await fetch(
          `/api/riot/player-data?summoner=${encodeURIComponent(username)}&region=${region}`
        );
        
        // El nuevo endpoint devuelve el objeto completo PlayerAPIResponse
        const json = (await res.json()) as PlayerAPIResponse | { error: string }; 
        
        if ("error" in json) {
            // El backend devuelve { error: 'Mensaje de error' }
            setError(json.error);
        } else {
            // El backend devuelve el objeto PlayerAPIResponse completo
            setData(json); 
        }

      } catch {
        setError("Error de red al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
    // 🛑 Añadimos la región a las dependencias del useEffect
  }, [username, region]); 

  if (!username || !region) return null;

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50 w-full">
      {loading && <p>Cargando estadísticas de {username} en {region.toUpperCase()}...</p>}
      {error && <p className="text-red-500 font-semibold">Error: {error}</p>}
      {data && (
        <div>
          <h2 className="font-bold text-lg">{data.summoner.name} (Nivel {data.summoner.summonerLevel})</h2>
          <p className="text-sm text-gray-600">Región: {region.toUpperCase()}</p>
          
          <h3 className="font-semibold mt-3 mb-1">Ranked Stats:</h3>
          {data.stats?.length ? (
            <div className="mt-2">
              {data.stats.map((stat) => (
                <div key={stat.queueType} className="border p-2 rounded mb-1 bg-white">
                  <p className="font-medium text-blue-700">
                    {stat.queueType.replace('_5X5', '').replace('_SOLO', ' Solo/Duo')}
                  </p>
                  <p>
                    <strong>{stat.tier} {stat.rank}</strong> ({stat.leaguePoints} LP)
                  </p>
                  <p className="text-sm text-gray-500">
                    W: {stat.wins} | L: {stat.losses} (Win Rate: {((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(0)}%)
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Sin estadísticas clasificatorias disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}
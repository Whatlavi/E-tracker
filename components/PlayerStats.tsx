// frontend/components/PlayerStats.tsx

import { useEffect, useState } from "react";

// --- INTERFACES ---
interface RankData {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface PlayerData {
  name: string;
  tagLine: string;
  summonerLevel: number;
  ranks: RankData[];
  error?: string;
}

// 🛑 Esperamos el RIOT ID completo
interface PlayerStatsProps {
  riotId: string; 
  region: string; 
}

export default function PlayerStats({ riotId, region }: PlayerStatsProps) { 
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // No necesitamos dividir el ID aquí, solo lo usamos para la URL y la interfaz

  useEffect(() => {
    if (!riotId || !region) return;

    const fetchPlayer = async () => {
      setError(null);
      setData(null);
      setLoading(true);

      try {
        // Enviamos el Riot ID completo y la región al backend
        const res = await fetch(
          `/api/riot/player-data?riotId=${encodeURIComponent(riotId)}&regionLoL=${region}`
        );
        
        const json = (await res.json()) as PlayerData; 
        
        if (json.error) {
            setError(json.error);
        } else {
            setData(json); 
        }

      } catch {
        setError("Error de red al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [riotId, region]); 

  if (!riotId || !region) return null;

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50 w-full" style={{ marginTop: 20, border: '1px solid #ddd', padding: 15, borderRadius: 8 }}>
      {loading && <p style={{ textAlign: 'center' }}>Cargando estadísticas de **{riotId}** en {region.toUpperCase()}...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>Error: {error}</p>}
      {data && (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>{data.name}#{data.tagLine} (Nivel {data.summonerLevel})</h2>
          <p style={{ fontSize: 14, color: '#555' }}>Región: {region.toUpperCase()}</p>
          
          <h3 style={{ fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Ranked Stats:</h3>
          {data.ranks?.length ? (
            <div style={{ marginTop: 5 }}>
              {data.ranks.map((stat) => (
                <div key={stat.queueType} style={{ border: '1px solid #eee', padding: 10, borderRadius: 5, marginBottom: 8, backgroundColor: '#fff' }}>
                  <p style={{ fontWeight: 'bold', color: '#0070f3' }}>
                    {stat.queueType.replace('RANKED_SOLO_5x5', 'Solo/Duo').replace('RANKED_FLEX_SR', 'Flexible')}
                  </p>
                  <p>
                    <strong>{stat.tier} {stat.rank}</strong> ({stat.leaguePoints} LP)
                  </p>
                  <p style={{ fontSize: 12, color: '#777' }}>
                    W: {stat.wins} | L: {stat.losses} (Win Rate: {((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(0)}%)
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#777' }}>Sin estadísticas clasificatorias disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}
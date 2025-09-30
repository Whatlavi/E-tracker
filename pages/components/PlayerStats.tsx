"use client";
import { useEffect, useState } from "react";

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

interface PlayerStatsProps {
  username: string;
}

export default function PlayerStats({ username }: PlayerStatsProps) {
  const [data, setData] = useState<PlayerAPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchPlayer = async () => {
      setError(null);
      setData(null);
      setLoading(true);

      try {
        const res = await fetch(
          `/api/player/${encodeURIComponent(username)}`
        );
        const json = (await res.json()) as PlayerAPIResponse | { error: string };
        if ("error" in json) setError(json.error);
        else setData(json);
      } catch {
        setError("Error fetching player");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [username]);

  if (!username) return null;

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50 w-full">
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <div>
          <h2 className="font-bold text-lg">{data.summoner.name}</h2>
          <p>Nivel: {data.summoner.summonerLevel}</p>
          {data.stats?.length ? (
            <div className="mt-2">
              {data.stats.map((stat) => (
                <div key={stat.queueType} className="border p-2 rounded mb-1">
                  <p>
                    <strong>{stat.queueType}</strong>: {stat.tier} {stat.rank} (
                    {stat.leaguePoints} LP)
                  </p>
                  <p>
                    Wins: {stat.wins} | Losses: {stat.losses}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>Sin estadísticas disponibles</p>
          )}
        </div>
      )}
    </div>
  );
}

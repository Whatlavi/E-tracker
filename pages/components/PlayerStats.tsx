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

// Definimos la interfaz de props
interface PlayerStatsProps {
  username: string;
}

export default function PlayerStats({ username }: PlayerStatsProps) {
  const [data, setData] = useState<PlayerAPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchPlayer = async () => {
      setError(null);
      setData(null);

      try {
        const res = await fetch(`/api/player/${username}`);
        const json = (await res.json()) as PlayerAPIResponse | { error: string };

        if ("error" in json) {
          setError(json.error);
        } else {
          setData(json);
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching player");
      }
    };

    fetchPlayer();
  }, [username]);

  if (!username) return null;

  return (
    <div className="mt-4">
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <div>
          <h2>{data.summoner.name}</h2>
          <p>Nivel: {data.summoner.summonerLevel}</p>

          {data.stats?.length ? (
            <div>
              <h3>Rank:</h3>
              {data.stats.map((stat) => (
                <div key={stat.queueType}>
                  {stat.queueType}: {stat.tier} {stat.rank} ({stat.leaguePoints} LP)
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

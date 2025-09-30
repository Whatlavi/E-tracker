"use client";
import { useState } from "react";

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

export default function Search() {
  const [name, setName] = useState<string>("");
  const [data, setData] = useState<PlayerAPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/summoner/${name}`);
      const json = (await res.json()) as PlayerAPIResponse | { error: string };
      if ("error" in json) setError(json.error);
      else setData(json);
    } catch (err) {
      console.error(err);
      setError("Error fetching summoner");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        placeholder="Summoner Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && data.stats && data.stats.length > 0 && (
        <div>
          <h2>{data.summoner.name}</h2>
          <p>Level: {data.summoner.summonerLevel}</p>
          <div>
            <h3>Rank:</h3>
            {data.stats.map((s) => (
              <div key={s.queueType}>
                {s.queueType}: {s.tier} {s.rank} ({s.leaguePoints} LP)
              </div>
            ))}
          </div>
        </div>
      )}

      {data && (!data.stats || data.stats.length === 0) && (
        <div>
          <h2>{data.summoner.name}</h2>
          <p>Level: {data.summoner.summonerLevel}</p>
          <p>No ranked stats available</p>
        </div>
      )}
    </div>
  );
}

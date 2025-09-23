import { useState } from "react";

type Props = { username: string };

export default function PlayerStats({ username }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/player/${username}`);
      if (!res.ok) throw new Error("Jugador no encontrado");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchStats}>Buscar stats</button>

      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}

      {data && (
        <div>
          <h2>{data.summoner.name}</h2>
          <p>Nivel: {data.summoner.summonerLevel}</p>

          {/* Stats de liga */}
          {data.stats?.map((s: any) => (
            <div key={s.queueType}>
              <h3>{s.queueType}</h3>
              <p>{s.tier} {s.rank} - {s.leaguePoints} LP</p>
              <p>{s.wins}W / {s.losses}L</p>
            </div>
          ))}

          {/* Kills totales de las últimas 20 partidas */}
          <p>Kills totales (últimas 20 partidas): {data.totalKills}</p>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

interface Summoner {
  profileIconId: number;
  revisionDate: number;
  puuid: string;
  summonerLevel: number;
  name: string;
}

interface Mastery {
  championId: number;
  championPoints: number;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [masteries, setMasteries] = useState<Mastery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (cleanName: string) => {
    if (!cleanName) return setError("Ingresa un nombre de invocador");

    setLoading(true);
    setError("");

    try {
      // 🔹 Obtener datos del summoner
      const summonerRes = await fetch(`/api/riot/summoner?summoner=${cleanName}`);
      if (!summonerRes.ok) throw new Error("No se pudo obtener el invocador");
      const summonerData: Summoner = await summonerRes.json();
      setSummoner(summonerData);

      // 🔹 Obtener últimas partidas por puuid
      const matchesRes = await fetch(`/api/riot/matches?puuid=${summonerData.puuid}`);
      if (!matchesRes.ok) throw new Error("No se pudieron obtener las partidas");
      const matchesData: string[] = await matchesRes.json();
      setMatches(matchesData.slice(0, 10));

      // 🔹 Obtener maestrías por puuid
      const masteryRes = await fetch(`/api/riot/champion-masteries?puuid=${summonerData.puuid}`);
      if (!masteryRes.ok) throw new Error("No se pudieron obtener las maestrías");
      const masteryData: Mastery[] = await masteryRes.json();
      setMasteries(masteryData.slice(0, 10));

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Ha ocurrido un error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">EliteGG Tracker</h1>

      <input
        type="text"
        placeholder="Nombre del invocador"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mr-2 text-white bg-black placeholder-white"
      />
      <button
        onClick={() => {
          const cleanName = username.split("#")[0].trim(); // elimina todo después de #
          fetchData(cleanName);
        }}
        className="bg-blue-500 text-white p-2 rounded mt-2"
        disabled={loading}
      >
        {loading ? "Cargando..." : "Buscar"}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {summoner && (
        <div className="mt-4 w-full">
          <h2 className="text-xl font-semibold">Info del Jugador:</h2>
          <pre>{JSON.stringify(summoner, null, 2)}</pre>
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-4 w-full">
          <h2 className="text-xl font-semibold">Últimas partidas:</h2>
          <ul>
            {matches.map((match) => (
              <li key={match}>{match}</li>
            ))}
          </ul>
        </div>
      )}

      {masteries.length > 0 && (
        <div className="mt-4 w-full">
          <h2 className="text-xl font-semibold">Maestrías de Campeón:</h2>
          <ul>
            {masteries.map((m) => (
              <li key={m.championId}>
                {m.championId} → Puntos: {m.championPoints}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

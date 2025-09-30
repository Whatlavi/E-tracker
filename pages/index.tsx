"use client";
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
    setSummoner(null);
    setMatches([]);
    setMasteries([]);

    try {
      // 🔹 Obtener datos del summoner
      const summonerRes = await fetch(`/api/riot/summoner?summoner=${cleanName}`);
      if (!summonerRes.ok) throw new Error("No se pudo obtener el invocador");
      const summonerData: Summoner = await summonerRes.json();
      setSummoner(summonerData);

      // 🔹 Obtener últimas partidas
      const matchesRes = await fetch(`/api/riot/matches?puuid=${summonerData.puuid}`);
      if (!matchesRes.ok) throw new Error("No se pudieron obtener las partidas");
      const matchesData: string[] = await matchesRes.json();
      setMatches(matchesData.slice(0, 10));

      // 🔹 Obtener maestrías de campeón
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold mb-6">EliteGG Tracker</h1>

      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Nombre del invocador"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-500 p-2 rounded text-white bg-black placeholder-white w-64"
        />
        <button
          onClick={() => {
            const cleanName = username.split("#")[0].trim();
            fetchData(cleanName);
          }}
          className="bg-blue-500 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {summoner && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Información del Jugador</h2>
          <ul>
            <li><strong>Nombre:</strong> {summoner.name}</li>
            <li><strong>Nivel:</strong> {summoner.summonerLevel}</li>
            <li><strong>PUUID:</strong> {summoner.puuid}</li>
            <li><strong>Profile Icon:</strong> {summoner.profileIconId}</li>
          </ul>
        </section>
      )}

      {matches.length > 0 && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Últimas Partidas</h2>
          <ul className="list-disc list-inside">
            {matches.map((match) => (
              <li key={match}>{match}</li>
            ))}
          </ul>
        </section>
      )}

      {masteries.length > 0 && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Maestrías de Campeón</h2>
          <ul className="list-disc list-inside">
            {masteries.map((m) => (
              <li key={m.championId}>
                Campeón {m.championId} → Puntos: {m.championPoints}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

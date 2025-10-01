"use client";
import { useState } from "react";

// --- INTERFACES DE DATOS ---

interface LeagueStat {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface Mastery {
  championId: number;
  championPoints: number;
}

// Interfaz para la respuesta del invocador (viene de /api/riot/player-data.ts)
interface SummonerData {
  id: string;
  name: string;
  puuid: string;
  summonerLevel: number;
  profileIconId: number;
}

// NOTA: Esta interfaz ya no envuelve el SummonerData, se usa solo para el estado local
interface PlayerState {
  summoner: SummonerData;
  stats?: LeagueStat[];
}

// --------------------------------------------------------------------

export default function Home() {
  const [username, setUsername] = useState("");
  const [playerData, setPlayerData] = useState<PlayerState | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [masteries, setMasteries] = useState<Mastery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (cleanName: string) => {
    if (!cleanName) return setError("Ingresa un nombre de invocador");

    setLoading(true);
    setError("");
    setPlayerData(null);
    setMatches([]);
    setMasteries([]);

    try {
      // 1. 🔹 Obtener datos del summoner
      const playerRes = await fetch(`/api/riot/player-data?summoner=${cleanName}`);

      if (!playerRes.ok) {
        // Maneja errores 404/500 de tu API Route
        const errorData = await playerRes.json().catch(() => ({ error: 'Error desconocido', details: '' }));
        throw new Error(`Error al buscar invocador: ${errorData.error} (${errorData.details})`);
      }
          
      // La respuesta es directamente el objeto SummonerData
      const data: SummonerData = await playerRes.json();
      
      // 🚨 CORRECCIÓN CLAVE: El PUUID ahora se lee directamente de 'data'
      const puuid = data.puuid; 
      if (!puuid) {
        throw new Error("Datos de invocador incompletos (falta PUUID).");
      }

      // Establece el estado principal
      setPlayerData({ summoner: data, stats: [] }); 

      // 2. 🔹 Obtener últimas partidas
      // El código del frontend ya asume que player-data.ts tiene el puuid
      const matchesRes = await fetch(`/api/riot/matches?puuid=${puuid}`);
      if (matchesRes.ok) {
        const matchesData: string[] = await matchesRes.json();
        setMatches(matchesData.slice(0, 10));
      } else {
        console.error("Fallo al cargar partidas.");
      }

      // 3. 🔹 Obtener maestrías de campeón
      const masteryRes = await fetch(`/api/riot/champion-masteries?puuid=${puuid}`);
      if (masteryRes.ok) {
        const masteryData: Mastery[] = await masteryRes.json();
        setMasteries(masteryData.slice(0, 10));
      } else {
        console.error("Fallo al cargar maestrías.");
      }

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Ha ocurrido un error desconocido.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const summoner = playerData?.summoner;
  // const stats = playerData?.stats; // Si implementas stats, úsalo aquí

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold mb-6">EliteGG Tracker</h1>

      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Nombre del invocador (ej: Faker)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-500 p-2 rounded text-white bg-black placeholder-white w-64"
        />
        <button
          onClick={() => {
            const cleanName = username.split("#")[0].trim();
            fetchData(cleanName);
          }}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          disabled={loading}
        >
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500 font-semibold">{error}</p>}

      {summoner && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded shadow-lg">
          <h2 className="text-2xl font-bold mb-3 border-b border-gray-700 pb-2">Información del Jugador: {summoner.name}</h2>
          <ul className="space-y-1">
            <li><strong>Nombre:</strong> {summoner.name}</li>
            <li><strong>Nivel:</strong> {summoner.summonerLevel}</li>
            <li><strong>PUUID:</strong> <span className="text-sm truncate inline-block max-w-full">{summoner.puuid}</span></li>
            <li><strong>Icono de Perfil:</strong> {summoner.profileIconId}</li>
          </ul>
        </section>
      )}
      
      {matches.length > 0 && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Últimas Partidas (Match IDs)</h2>
          <ul className="list-disc list-inside space-y-1">
            {matches.map((match) => (
              <li key={match} className="text-sm truncate">{match}</li>
            ))}
          </ul>
        </section>
      )}

      {masteries.length > 0 && (
        <section className="mt-6 w-full max-w-2xl bg-gray-900 p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Maestrías de Campeón (Top 10)</h2>
          <ul className="list-disc list-inside space-y-1">
            {masteries.map((m) => (
              <li key={m.championId}>
                Campeón **{m.championId}** → Puntos: **{m.championPoints.toLocaleString()}**
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
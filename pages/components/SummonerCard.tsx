import React, { useState } from "react";

export default function SummonerCard() {
  const [name, setName] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummoner = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/riot/player?summonerName=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "Error fetching summoner");
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-2">Buscar Summoner</h2>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Nombre del summoner"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </div>
      <button
        onClick={fetchSummoner}
        disabled={loading || !name}
        className="p-2 bg-blue-600 text-white rounded w-full"
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {data && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg">{data.summoner.name}</h3>
          <p>Nivel: {data.summoner.summonerLevel}</p>

          {data.stats && data.stats.length > 0 ? (
            <div className="mt-2">
              <h4 className="font-semibold">Ranked:</h4>
              {data.stats.map((s: any) => (
                <div key={s.queueType} className="border p-2 rounded mb-1">
                  <p>Queue: {s.queueType}</p>
                  <p>
                    Tier: {s.tier} {s.rank} ({s.leaguePoints} LP)
                  </p>
                  <p>
                    Wins: {s.wins} | Losses: {s.losses}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No tiene ranked</p>
          )}
        </div>
      )}
    </div>
  );
}

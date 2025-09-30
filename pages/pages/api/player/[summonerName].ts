import type { NextApiRequest, NextApiResponse } from "next";

// Aquí ponemos la línea
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { summonerName } = req.query;

  if (!summonerName || typeof summonerName !== "string") {
    return res.status(400).json({ error: "Summoner name is required" });
  }

  try {
    // Obtener datos del invocador
    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY! } } // usamos la variable aquí
    );

    if (!summonerRes.ok) throw new Error("Summoner not found");
    const summonerData = await summonerRes.json();

    // Obtener estadísticas
    const statsRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY! } }
    );

    if (!statsRes.ok) throw new Error("Stats not found");
    const statsData = await statsRes.json();

    res.status(200).json({ summoner: summonerData, stats: statsData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

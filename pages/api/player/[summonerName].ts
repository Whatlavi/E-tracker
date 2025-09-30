import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerAPIResponse | { error: string }>
) {
  const { summonerName } = req.query;

  if (!summonerName || typeof summonerName !== "string") {
    return res.status(400).json({ error: "Summoner name is required" });
  }

  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  if (!RIOT_API_KEY) {
    return res.status(500).json({ error: "Riot API key not configured" });
  }

  try {
    // Datos del invocador
    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerName
      )}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );

    if (!summonerRes.ok) {
      return res.status(summonerRes.status).json({ error: "Summoner not found" });
    }

    const summonerData: SummonerData = await summonerRes.json();

    // Estadísticas del invocador
    const statsRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );

    const statsData: LeagueStat[] = statsRes.ok ? await statsRes.json() : [];

    res.status(200).json({ summoner: summonerData, stats: statsData });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    res.status(500).json({ error: message });
  }
}

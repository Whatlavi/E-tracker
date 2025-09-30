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

interface RiotLeagueEntry {
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
    // 1️⃣ Obtener datos del invocador
    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerName
      )}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );

    if (!summonerRes.ok) {
      const errorText = await summonerRes.text();
      return res
        .status(summonerRes.status)
        .json({ error: `Summoner not found: ${errorText}` });
    }

    const summonerData: SummonerData = await summonerRes.json();

    // 2️⃣ Obtener estadísticas de ranked
    const statsRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );

    let statsData: LeagueStat[] = [];
    if (statsRes.ok) {
      const rawStats: RiotLeagueEntry[] = await statsRes.json();
      statsData = rawStats.map((entry) => ({
        queueType: entry.queueType,
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      }));
    }

    res.status(200).json({ summoner: summonerData, stats: statsData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

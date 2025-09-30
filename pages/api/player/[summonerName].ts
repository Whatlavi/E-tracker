import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import fetch from "node-fetch";

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

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerAPIResponse | { error: string }>
) {
  const { summonerName } = req.query;

  if (!summonerName || typeof summonerName !== "string") {
    return res.status(400).json({ error: "Summoner name is required" });
  }

  try {
    const rawCookies = req.headers.cookie || "";
    const cookies = cookie.parse(rawCookies);
    const token = cookies.riot_token;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : { "X-Riot-Token": RIOT_API_KEY };

    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers }
    );
    if (!summonerRes.ok) throw new Error("Jugador no encontrado");
    const summonerData: SummonerData = await summonerRes.json() as SummonerData;

    const statsRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
      { headers }
    );
    const statsData: LeagueStat[] = statsRes.ok ? await statsRes.json() as LeagueStat[] : [];

    res.status(200).json({ summoner: summonerData, stats: statsData });
  } catch (err: unknown) {
    let message = "Error desconocido";
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: message });
  }
}

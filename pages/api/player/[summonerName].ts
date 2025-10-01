export const dynamic = 'force-dynamic';

import { NextApiRequest, NextApiResponse } from 'next';

interface SummonerData {
  id: string;
  name: string;
  puuid: string;
  summonerLevel: number;
  profileIconId?: number;
}

interface LeagueStat {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

// Tipado del objeto crudo que viene de la API de Riot
interface RawLeagueEntry {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<PlayerAPIResponse | { error: string }>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { summonerName } = req.query;
  if (!summonerName || typeof summonerName !== 'string') return res.status(400).json({ error: 'Summoner name is required' });

  try {
    const RIOT_API_KEY = process.env.RIOT_API_KEY;
    if (!RIOT_API_KEY) return res.status(500).json({ error: 'Riot API key not configured' });

    const summonerRes = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY },
    });

    if (!summonerRes.ok) {
      const text = await summonerRes.text();
      return res.status(summonerRes.status).json({ error: `Summoner not found: ${text}` });
    }

    const summonerData: SummonerData = await summonerRes.json();

    const statsRes = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY },
    });

    let stats: LeagueStat[] = [];
    if (statsRes.ok) {
      const rawStats: RawLeagueEntry[] = await statsRes.json();
      stats = rawStats.map((entry) => ({
        queueType: entry.queueType,
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      }));
    }

    res.status(200).json({ summoner: summonerData, stats });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

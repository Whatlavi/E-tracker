export const dynamic = 'force-dynamic';

import { NextApiRequest, NextApiResponse } from 'next';

interface Mastery {
  championId: number;
  championPoints: number;
}

// Tipado crudo de Riot API
interface RawMastery {
  championId: number;
  championPoints: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Mastery[] | { error: string }>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const puuid = req.query.puuid;
  if (!puuid || typeof puuid !== 'string') return res.status(400).json({ error: 'PUUID is required' });

  try {
    const RIOT_API_KEY = process.env.RIOT_API_KEY;
    if (!RIOT_API_KEY) return res.status(500).json({ error: 'Riot API key not configured' });

    const masteryRes = await fetch(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${puuid}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY },
    });

    if (!masteryRes.ok) {
      const text = await masteryRes.text();
      return res.status(masteryRes.status).json({ error: `Failed to fetch champion masteries: ${text}` });
    }

    const rawData: RawMastery[] = await masteryRes.json();
    const masteries: Mastery[] = rawData.map((m) => ({
      championId: m.championId,
      championPoints: m.championPoints,
    }));

    res.status(200).json(masteries.slice(0, 10));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

// pages/api/riot/matches.ts
export const dynamic = 'force-dynamic';

import { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse<string[] | { error: string }>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const puuid = req.query.puuid;
  if (!puuid || typeof puuid !== 'string') return res.status(400).json({ error: 'PUUID is required' });

  try {
    if (!RIOT_API_KEY) return res.status(500).json({ error: 'Riot API key not configured' });

    // NOTA: La API de Match usa la ruta regional 'europe' para EUW1.
    const matchesRes = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY },
    });

    if (!matchesRes.ok) {
      const text = await matchesRes.text();
      return res.status(matchesRes.status).json({ error: `Failed to fetch matches: ${text}` });
    }

    const matches: string[] = await matchesRes.json();
    res.status(200).json(matches);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
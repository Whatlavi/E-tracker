import type { NextApiRequest, NextApiResponse } from 'next';

const REGION = 'euw1';
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { puuid } = req.query;
  if (!puuid) return res.status(400).json({ error: 'Falta el PUUID del invocador' });

  try {
    // Obtener summonerId primero
    const summonerRes = await fetch(
      `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );
    if (!summonerRes.ok) return res.status(summonerRes.status).json({ error: 'No se pudo obtener el summonerId' });

    const summonerData = await summonerRes.json();
    const summonerId = summonerData.id;

    const masteryRes = await fetch(
      `https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );

    if (!masteryRes.ok) return res.status(masteryRes.status).json({ error: 'No se pudieron obtener las maestrías' });

    const masteryData = await masteryRes.json();
    res.status(200).json(masteryData.slice(0, 10)); // Top 10
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener maestrías', details: err });
  }
}

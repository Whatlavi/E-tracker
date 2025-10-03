// pages/api/riot/champion-masteries.ts - CORREGIDO
import type { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORRECCIÓN: Recibir la región de plataforma (euw1, na1, etc.)
  const { puuid, regionLoL } = req.query as { puuid?: string, regionLoL?: string }; 
  
  if (!puuid || !regionLoL) return res.status(400).json({ error: 'Faltan parámetros requeridos: PUUID y la Región de Plataforma (euw1/na1/etc.).' });
  if (!RIOT_API_KEY) return res.status(500).json({ error: 'RIOT_API_KEY no definida.' });

  try {
    // 1. Obtener summonerId (usando la región de plataforma)
    const summonerRes = await fetch(
      // CORRECCIÓN: Usar la región de plataforma dinámica
      `https://${regionLoL}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );
    
    if (!summonerRes.ok) return res.status(summonerRes.status).json({ error: 'No se pudo obtener el summonerId para maestrías' });

    const summonerData = await summonerRes.json();
    const summonerId = summonerData.id;

    // 2. Obtener maestrías (usando la región de plataforma)
    const masteryRes = await fetch(
      // CORRECCIÓN: Usar la región de plataforma dinámica
      `https://${regionLoL}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );

    if (!masteryRes.ok) {
        const errorData = await masteryRes.json();
        return res.status(masteryRes.status).json(errorData);
    }

    const masteryData = await masteryRes.json();
    res.status(200).json(masteryData.slice(0, 10)); // Top 10
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener maestrías', details: (err as Error).message });
  }
}
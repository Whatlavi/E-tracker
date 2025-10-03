// pages/api/riot/matches.ts - CORREGIDO
import type { NextApiRequest, NextApiResponse } from 'next';

// Se asume que la clave está definida en Vercel
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORRECCIÓN: Ahora se espera el puuid y la región global (europe, americas, etc.)
  // El front-end o player-data.ts debe pasar el valor correcto.
  const { puuid, globalRegion } = req.query as { puuid?: string, globalRegion?: string }; 
  
  if (!puuid || !globalRegion) return res.status(400).json({ 
      error: 'Faltan parámetros requeridos: PUUID y la Región Global (europe/americas/asia).' 
  });
  if (!RIOT_API_KEY) return res.status(500).json({ error: 'RIOT_API_KEY no definida.' });

  try {
    const response = await fetch(
      // CORRECCIÓN: Usar la región global dinámica para Match-v5
      `https://${globalRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );

    if (!response.ok) {
        // Manejo de 403/404/429
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partidas', details: (err as Error).message });
  }
}
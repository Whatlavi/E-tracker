import type { NextApiRequest, NextApiResponse } from 'next';

const REGION = 'europe'; // Para match-v5 usar región global
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { puuid } = req.query;
  if (!puuid) return res.status(400).json({ error: 'Falta el PUUID del invocador' });

  try {
    const response = await fetch(
      `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );

    if (!response.ok) return res.status(response.status).json({ error: 'No se pudieron obtener las partidas' });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partidas', details: err });
  }
}

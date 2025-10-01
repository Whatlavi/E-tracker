import type { NextApiRequest, NextApiResponse } from 'next';

const REGION = 'euw1'; // Cambia según tu región
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { summoner } = req.query;

  if (!summoner || typeof summoner !== 'string') {
    return res.status(400).json({ error: 'Falta el nombre del invocador' });
  }

  try {
    const response = await fetch(
      `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY! } }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al conectarse a Riot API', details: err });
  }
}

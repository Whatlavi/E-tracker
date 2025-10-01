// pages/api/riot/player-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

interface SummonerData {
  id: string;
  name: string;
  puuid: string; // La propiedad que falta
  summonerLevel: number;
}

interface ErrorResponse {
    error: string;
    details?: string;
}

const REGION = 'euw1'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse<SummonerData | ErrorResponse>) {
  const { summoner } = req.query;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  
  // 🛑 LOG DE VERIFICACIÓN CLAVE (PARA LA TERMINAL)
  console.log('--- DIAGNÓSTICO DE CLAVE API ---');
  console.log('CLAVE LEÍDA (Primeros 10 caracteres):', RIOT_API_KEY ? RIOT_API_KEY.substring(0, 10) : '¡CLAVE NO ENCONTRADA!');
  console.log('---------------------------------');

  if (!summoner || typeof summoner !== 'string') {
    return res.status(400).json({ error: 'Falta el nombre del invocador' });
  }
  
  if (!RIOT_API_KEY) {
    return res.status(500).json({ error: 'Riot API key no configurada' });
  }

  try {
    const response = await fetch(
      `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summoner)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    if (!response.ok) {
      // Si Riot responde con un error (ej. 404), lanzamos una respuesta de error clara
      const errorData = await response.json().catch(() => ({}));
      const statusMessage = errorData.status?.message || 'Invocador no encontrado';
      return res.status(response.status).json({ error: `Error ${response.status}: ${statusMessage}` });
    }

    const data: SummonerData = await response.json();
    
    // **Verificación crucial: Asegurar que PUUID existe antes de responder**
    if (!data.puuid) {
        return res.status(500).json({ error: 'Respuesta de Riot incompleta', details: 'Falta la propiedad PUUID en los datos del invocador.' });
    }
    
    res.status(200).json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error de red o servidor desconocido';
    res.status(500).json({ error: 'Error al conectarse a Riot API', details: errorMessage });
  }
}
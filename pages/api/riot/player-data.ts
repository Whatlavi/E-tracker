import type { NextApiRequest, NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

interface SummonerData {
  id: string;
  name: string;
  puuid: string;
  summonerLevel: number;
}

interface ErrorResponse {
    error: string;
    details?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SummonerData | ErrorResponse>) {
  // Recibimos el invocador y la región del query
  const { summoner, region } = req.query;
  
  // Usamos la región recibida.
  const requestedRegion = (region && typeof region === 'string') ? region.toLowerCase() : 'euw1';
  
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  
  // Logs de diagnóstico (útiles en Vercel)
  console.log('--- DIAGNÓSTICO ---');
  console.log('REGIÓN SOLICITADA:', requestedRegion.toUpperCase());
  console.log('-------------------');

  if (!summoner || typeof summoner !== 'string') {
    return res.status(400).json({ error: 'Falta el nombre del invocador' });
  }
  
  if (!RIOT_API_KEY) {
    return res.status(500).json({ error: 'Riot API key no configurada' });
  }

  try {
    // Usamos requestedRegion para la URL
    const response = await fetch(
      `https://${requestedRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summoner)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    if (!response.ok) {
      // Manejo de errores de Riot (ej. 404 Not Found, 403 Forbidden)
      const errorData = await response.json().catch(() => ({}));
      let statusMessage = errorData.status?.message;

      if (response.status === 404) {
          statusMessage = `Invocador no encontrado en la región ${requestedRegion.toUpperCase()}.`;
      } else if (response.status === 403) {
           statusMessage = 'Clave API no válida/expirada. Revisa Vercel/logs.';
      }
      
      return res.status(response.status).json({ error: `Error ${response.status}: ${statusMessage || 'Error de la API de Riot'}` });
    }

    const data: SummonerData = await response.json();
    
    // Validación de respuesta
    if (!data.puuid) {
        return res.status(500).json({ error: 'Respuesta de Riot incompleta', details: 'Falta la propiedad PUUID.' });
    }
    
    res.status(200).json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error de red o servidor desconocido';
    res.status(500).json({ error: 'Error al conectarse a Riot API', details: errorMessage });
  }
}
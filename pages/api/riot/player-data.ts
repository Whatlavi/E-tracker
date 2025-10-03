import type { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapeo de Región de Plataforma (euw1, na1) a Región de RUTA (europe, americas)
const PLATFORM_TO_ROUTING_REGION: { [key: string]: string } = {
    // Europa
    'euw1': 'europe',
    'eun1': 'europe',
    'ru': 'europe',
    'tr1': 'europe',

    // Américas
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas', // LAN
    'la2': 'americas', // LAS

    // Asia
    'kr': 'asia',
    'jp1': 'asia',

    // PBE
    'pbe1': 'pbe' 
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { riotId, tagLine, regionLoL } = req.query as { riotId?: string, tagLine?: string, regionLoL?: string }; 
    
    if (!riotId || !tagLine || !regionLoL) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: riotId, tagLine y regionLoL.' });
    }
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: 'RIOT_API_KEY no definida.' });
    }

    // 1. CONVERSIÓN DE LA REGIÓN PARA LA PRIMERA LLAMADA (SOLUCIÓN 403)
    const platformRegion = regionLoL.toLowerCase();
    const routingRegion = PLATFORM_TO_ROUTING_REGION[platformRegion];

    if (!routingRegion) {
        return res.status(400).json({ error: 'Región de plataforma no válida. Usa euw1, na1, etc.' });
    }

    try {
        // LLAMADA 1: Obtener PUUID por Riot ID (Usa la REGIÓN DE RUTA)
        const accountUrl = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${riotId}/${tagLine}`;
        
        const accountRes = await fetch(accountUrl, { 
            headers: { 'X-Riot-Token': RIOT_API_KEY! } 
        });

        if (!accountRes.ok) {
            try {
                const errorData = await accountRes.json();
                return res.status(accountRes.status).json(errorData); 
            } catch (jsonError) {
                return res.status(accountRes.status).json({ error: `Fallo de la API de Riot (Account): ${accountRes.statusText}` });
            }
        }

        const accountData = await accountRes.json();
        const puuid = accountData.puuid;


        // LLAMADA 2: Obtener Summoner ID y Nivel (Usa la REGIÓN DE PLATAFORMA original)
        const summonerUrl = `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        
        const summonerRes = await fetch(summonerUrl, { 
            headers: { 'X-Riot-Token': RIOT_API_KEY! } 
        });

        if (!summonerRes.ok) {
            try {
                const errorData = await summonerRes.json();
                return res.status(summonerRes.status).json(errorData);
            } catch (jsonError) {
                return res.status(summonerRes.status).json({ error: `Fallo de la API de Riot (Summoner): ${summonerRes.statusText}` });
            }
        }

        const summonerData = await summonerRes.json();

        // 3. Devolver los datos clave para el frontend
        res.status(200).json({
            puuid: puuid,
            summonerId: summonerData.id,
            summonerLevel: summonerData.summonerLevel, 
            profileIconId: summonerData.profileIconId, // <-- CLAVE PARA LA IMAGEN
            regionPlataforma: platformRegion,
            gameName: accountData.gameName,
            tagLine: accountData.tagLine
        });

    } catch (err) {
        res.status(500).json({ error: 'Error interno en la secuencia de la API de Riot.', details: (err as Error).message });
    }
}
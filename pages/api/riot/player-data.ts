// pages/api/riot/player-data.ts

// Usamos import/export y AxiosError para evitar errores de linter/TypeScript
import axios, { AxiosError } from 'axios'; 
import { NextApiRequest, NextApiResponse } from 'next';

// 1. CONFIGURACIÓN
const RIOT_API_KEY = process.env.RIOT_API_KEY; 

const REGION_ROUTING: { [key: string]: string } = {
    euw1: 'europe',
    na1: 'americas',
    kr: 'asia',
    // ... agrega más regiones si es necesario
};

// 2. FUNCIÓN HANDLER
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    // Tipado de la query para evitar errores de TypeScript
    const { riotId, tagLine, regionLoL = 'euw1' } = req.query as { 
        riotId?: string; 
        tagLine?: string; 
        regionLoL?: string;
    };
    
    // --- VALIDACIONES INICIALES ---
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: 'Error de Configuración: La variable RIOT_API_KEY no está definida.' });
    }

    if (!riotId || typeof riotId !== 'string' || !tagLine || typeof tagLine !== 'string') {
        return res.status(400).json({ error: 'Riot ID (gameName y tagLine) son obligatorios para la búsqueda.' });
    }

    const lowerCaseRegion = regionLoL.toLowerCase();
    const regionalRoute = REGION_ROUTING[lowerCaseRegion];

    if (!regionalRoute) {
        return res.status(400).json({ error: 'Región de LoL no válida o no soportada.' });
    }

    const headers = {
        'X-Riot-Token': RIOT_API_KEY,
    };

    console.log(`[DIAGNÓSTICO] Buscando Riot ID: ${riotId}#${tagLine} en ${lowerCaseRegion.toUpperCase()}`);

    try {
        // === PASO 1: OBTENER PUUID (API Account-v1) ===
        const accountUrl = `https://${regionalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${riotId}/${tagLine}`;
        
        const accountResponse = await axios.get(accountUrl, { headers });
        const puuid: string = accountResponse.data.puuid; 

        // === PASO 2: OBTENER SUMMONER ID (API Summoner-v4) ===
        const summonerUrl = `https://${lowerCaseRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

        const summonerResponse = await axios.get(summonerUrl, { headers });
        const { id: summonerId, ...summonerData } = summonerResponse.data; 

        // === PASO 3: OBTENER DATOS DE LA LIGA/RANK (API League-v4) ===
        const rankUrl = `https://${lowerCaseRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
        
        const rankResponse = await axios.get(rankUrl, { headers });
        const rankData = rankResponse.data;

        // === 4. DEVOLVER DATOS COMBINADOS ===
        res.status(200).json({
            ...summonerData,
            puuid,
            summonerId,
            ranks: rankData, 
            region: lowerCaseRegion.toUpperCase(),
        });

    } catch (error) { 
        // --- MANEJO DE ERRORES ---
        let status = 500;
        let message = 'Error desconocido al buscar datos del invocador.';

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                status = axiosError.response.status;
                
                if (status === 403) {
                    message = 'Error 403: Clave API no válida o expirada. ¡Revisa tu clave en Vercel/logs!';
                } 
                else if (status === 404) {
                     message = 'Error 404: El Riot ID no fue encontrado o el invocador no tiene datos de liga.';
                } 
                // ... (Otros errores manejados correctamente)
            }
        } else {
            message = (error as Error).message || message;
        }

        console.error(`Error en la llamada a Riot API (Status: ${status}):`, message);
        res.status(status).json({ error: message });
    }
}
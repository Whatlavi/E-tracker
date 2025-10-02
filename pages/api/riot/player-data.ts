// pages/api/riot/player-data.ts - VERSIÓN FINAL Y COMPLETA (Next.js API)

import axios, { AxiosError } from 'axios'; 
import { NextApiRequest, NextApiResponse } from 'next';

// Asegúrate de definir esta variable en tu archivo .env.local
const RIOT_API_KEY = process.env.RIOT_API_KEY; 

// Mapeo de región de juego (plataforma) a la ruta regional (cluster)
const REGION_ROUTING: { [key: string]: string } = {
    euw1: 'europe', 
    na1: 'americas', 
    kr: 'asia', 
    eun1: 'europe',
    br1: 'americas',
    la1: 'americas', 
    la2: 'americas', 
    oc1: 'sea', 
    // Agrega más regiones si es necesario
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    // 1. EXTRAER PARÁMETROS: Esperamos riotId (Nombre) y tagLine (TAG) SEPARADOS
    const { 
        riotId: riotIdNameRaw, 
        tagLine: tagLineRaw, 
        regionLoL = 'euw1' 
    } = req.query as { 
        riotId?: string; 
        tagLine?: string;
        regionLoL?: string;
    };
    
    // --- Validaciones iniciales ---
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: 'Error de Configuración: La variable RIOT_API_KEY no está definida.' });
    }

    if (!riotIdNameRaw || !tagLineRaw || typeof riotIdNameRaw !== 'string' || typeof tagLineRaw !== 'string') {
        return res.status(400).json({ error: 'Parámetros incompletos. Se requieren el Nombre (riotId) y el TAG (tagLine).' });
    }

    // Limpiamos y validamos la región
    const riotIdName = riotIdNameRaw.trim();
    const tagLine = tagLineRaw.trim();
    const lowerCaseRegion = regionLoL.toLowerCase();
    const regionalRoute = REGION_ROUTING[lowerCaseRegion]; 

    if (!regionalRoute) {
        return res.status(400).json({ error: 'Región de LoL no válida o no soportada.' });
    }

    // Autenticación con Header
    const headers = { 'X-Riot-Token': RIOT_API_KEY };

    try {
        // === PASO 1: OBTENER PUUID (API Account-v1) - RUTA REGIONAL (ej: europe) ===
        // Usamos encodeURIComponent() para manejar nombres o tags con espacios
        const encodedName = encodeURIComponent(riotIdName);
        const encodedTag = encodeURIComponent(tagLine);
        
        const accountUrl = `https://${regionalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`;
        
        const accountResponse = await axios.get(accountUrl, { headers });
        const puuid: string = accountResponse.data.puuid; 

        // === PASO 2: OBTENER SUMMONER ID y NIVEL (API Summoner-v4) - RUTA DE PLATAFORMA (ej: euw1) ===
        const summonerUrl = `https://${lowerCaseRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

        const summonerResponse = await axios.get(summonerUrl, { headers });
        const { id: summonerId, ...summonerData } = summonerResponse.data; 

        // === PASO 3: OBTENER DATOS DE LA LIGA/RANK (API League-v4) - RUTA DE PLATAFORMA ===
        const rankUrl = `https://${lowerCaseRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
        
        const rankResponse = await axios.get(rankUrl, { headers });
        const rankData = rankResponse.data;

        // === 4. DEVOLVER DATOS COMBINADOS ===
        res.status(200).json({
            ...summonerData, 
            name: riotIdName, 
            tagLine: tagLine, 
            puuid,
            summonerId,
            ranks: rankData, 
            region: lowerCaseRegion.toUpperCase(),
        });

    } catch (error) { 
        // --- MANEJO DE ERRORES DETALLADO ---
        let status = 500;
        let message = 'Error desconocido al buscar datos del invocador.';

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            status = axiosError.response?.status || 500;
            
            if (status === 403) {
                message = 'Error 403: Clave API no válida o caducada.';
            } else if (status === 404) {
                message = `Error 404: El Riot ID "${riotIdName}#${tagLine}" no fue encontrado en la región seleccionada.`;
            } else if (status === 429) {
                message = 'Error 429: Límite de peticiones excedido. Inténtalo de nuevo más tarde.';
            } else {
                const riotMessage = (axiosError.response?.data as {status?: {message?: string}}).status?.message;
                message = riotMessage || `Error ${status} en el servidor de Riot.`;
            }
        }

        res.status(status).json({ error: message });
    }
}
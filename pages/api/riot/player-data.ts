// pages/api/riot/player-data.ts - VERSIÓN FINAL CON HEADERS COMPLETOS
import axios, { AxiosError } from 'axios'; 
import { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY; 

// Base de los Request Headers, incluyendo los headers de emulación de navegador
const BASE_HEADERS = {
    // Headers que nos pediste añadir:
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9",
    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    // El header CRÍTICO de la clave API (se añade en el código más abajo)
    // El header 'Origin' lo gestiona el servidor, no es necesario añadirlo aquí.
};


// Mapeo de región de juego (Plataforma: euw1) a la ruta regional (Cluster: europe)
const REGION_ROUTING: { [key: string]: string } = {
    euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe', 
    na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas', 
    kr: 'asia', jp1: 'asia', oc1: 'sea', sg2: 'sea', ph2: 'sea', tw2: 'sea', th2: 'sea', vn2: 'sea',
};

// Mapeo de Tagline (el TAG del Riot ID) a la región de Plataforma (ej: EUW -> euw1)
const TAGLINE_TO_PLATFORM: { [key: string]: string } = {
    EUW: 'euw1', EUNE: 'eun1', TR: 'tr1', RU: 'ru',
    NA: 'na1', BR: 'br1', LAN: 'la1', LAS: 'la2',
    KR: 'kr', JP: 'jp1', OCE: 'oc1', SEA: 'oc1',
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    const { 
        riotId: riotIdNameRaw, 
        tagLine: tagLineRaw, 
        regionLoL: regionLoLRaw 
    } = req.query as { 
        riotId?: string; 
        tagLine?: string;
        regionLoL?: string;
    };
    
    // 1. Validaciones Iniciales y Preparación
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: 'Error de Configuración: La variable RIOT_API_KEY no está definida.' });
    }

    if (!riotIdNameRaw || !tagLineRaw) {
        return res.status(400).json({ error: 'Parámetros incompletos. Se requieren el Nombre (riotId) y el TAG (tagLine).' });
    }

    const riotIdName = riotIdNameRaw.trim();
    const tagLine = tagLineRaw.trim().toUpperCase();
    
    // Determinar Rutas
    const platformRegionFromTag = TAGLINE_TO_PLATFORM[tagLine];
    const platformRegionFromQuery = regionLoLRaw?.toLowerCase() || 'euw1';
    const platformRegion = platformRegionFromTag || platformRegionFromQuery; 
    const globalRoute = REGION_ROUTING[platformRegion]; 

    if (!globalRoute) {
        return res.status(400).json({ error: `Región no válida o no soportada: ${platformRegion}.` });
    }

    // Unimos los headers base con el header de autenticación
    const headers = { 
        ...BASE_HEADERS,
        'X-Riot-Token': RIOT_API_KEY // CRÍTICO: La clave API
    };

    try {
        // === PASO 1: OBTENER PUUID (API Account-v1) - RUTA GLOBAL ===
        const encodedName = encodeURIComponent(riotIdName);
        const encodedTag = encodeURIComponent(tagLine);
        
        const accountUrl = `https://${globalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`;
        
        const accountResponse = await axios.get(accountUrl, { headers }); // Usando los nuevos headers
        const puuid: string = accountResponse.data.puuid; 

        // === PASO 2: OBTENER SUMMONER ID (API Summoner-v4) - RUTA DE PLATAFORMA ===
        const summonerUrl = `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

        const summonerResponse = await axios.get(summonerUrl, { headers }); // Usando los nuevos headers
        const { id: summonerId, ...summonerData } = summonerResponse.data; 

        // === PASO 3: OBTENER DATOS DE LA LIGA/RANK (API League-v4) - RUTA DE PLATAFORMA ===
        const rankUrl = `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
        
        const rankResponse = await axios.get(rankUrl, { headers }); // Usando los nuevos headers
        const rankData = rankResponse.data;

        // === 4. DEVOLVER DATOS COMBINADOS ===
        res.status(200).json({
            ...summonerData, 
            name: riotIdName, 
            tagLine: tagLine, 
            puuid,
            summonerId,
            ranks: rankData, 
            region: platformRegion.toUpperCase(),
        });

    } catch (error) { 
        // --- MANEJO DE ERRORES DETALLADO (Sin Cambios) ---
        let status = 500;
        let message = 'Error desconocido al buscar datos del invocador.';

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            status = axiosError.response?.status || 500;
            
            if (status === 404) {
                message = `Error 404: El Riot ID "${riotIdName}#${tagLine}" no fue encontrado en la región ${platformRegion.toUpperCase()}. Verifica el nombre y el Tagline.`;
            } else if (status === 403) {
                message = 'Error 403: Clave API no válida o acceso prohibido.';
            } else if (status === 429) {
                message = 'Error 429: Límite de peticiones excedido.';
            } else {
                const riotMessage = (axiosError.response?.data as {status?: {message?: string}}).status?.message;
                message = riotMessage || `Error ${status} en el servidor de Riot.`;
            }
        }

        res.status(status).json({ error: message });
    }
}
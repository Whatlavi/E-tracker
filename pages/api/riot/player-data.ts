// pages/api/riot/player-data.ts - VERSIÓN FINAL Y COMPLETA

import axios, { AxiosError } from 'axios'; 
import { NextApiRequest, NextApiResponse } from 'next';

const RIOT_API_KEY = process.env.RIOT_API_KEY; 

// Mapeo de región de juego (plataforma: euw1) a la ruta regional (europe)
const REGION_ROUTING: { [key: string]: string } = {
    euw1: 'europe', 
    na1: 'americas', 
    kr: 'asia', 
    eun1: 'europe',
    br1: 'americas',
    la1: 'americas', 
    la2: 'americas', 
    oc1: 'sea', 
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    const { riotId, regionLoL = 'euw1' } = req.query as { 
        riotId?: string; 
        regionLoL?: string;
    };
    
    // --- VALIDACIONES INICIALES ---
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: 'Error de Configuración: La variable RIOT_API_KEY no está definida en el entorno.' });
    }

    if (!riotId || typeof riotId !== 'string') {
        return res.status(400).json({ error: 'Riot ID es obligatorio para la búsqueda.' });
    }

    // 🛑 FIX FINAL: Decodificar y normalizar el Riot ID
    let decodedRiotId = riotId;
    try {
        // 1. Intentamos decodificar cualquier codificación URL que traiga
        decodedRiotId = decodeURIComponent(riotId);
    } catch (e) {
        // En caso de un error de decodificación, usamos la string original
    }

    // 2. Normalizamos: Reemplazar cualquier %23 restante con el símbolo #
    const normalizedRiotId = decodedRiotId.replace(/%23/g, '#');

    // 3. Separar por #
    const parts = normalizedRiotId.split('#');
    // 🛑 FIN FIX

    if (parts.length !== 2 || parts[0].trim() === '' || parts[1].trim() === '') {
        return res.status(400).json({ error: 'Formato de Riot ID incorrecto. Debe ser NombreDeJuego#TAG.' });
    }
    const [riotIdName, tagLine] = parts;

    const lowerCaseRegion = regionLoL.toLowerCase();
    const regionalRoute = REGION_ROUTING[lowerCaseRegion]; 

    if (!regionalRoute) {
        return res.status(400).json({ error: 'Región de LoL no válida o no soportada.' });
    }

    const headers = { 'X-Riot-Token': RIOT_API_KEY };

    try {
        // === PASO 1: OBTENER PUUID (API Account-v1) - RUTA REGIONAL ===
        const accountUrl = `https://${regionalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotIdName)}/${encodeURIComponent(tagLine)}`;
        
        const accountResponse = await axios.get(accountUrl, { headers });
        const puuid: string = accountResponse.data.puuid; 

        // === PASO 2: OBTENER SUMMONER ID (API Summoner-v4) - RUTA DE PLATAFORMA ===
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
            name: summonerData.name, 
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
                message = 'Error 403: La Clave API de Riot no es válida o ha caducado. Revisa la variable RIOT_API_KEY.';
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
// services/riot-api.ts

import axios, { AxiosError } from 'axios';
import { env } from 'process';

// Usaremos la clave API de las variables de entorno
const RIOT_API_KEY = env.RIOT_API_KEY;

// ----------------------------------------------------
// Lógica de Petición Genérica a Match-V5
// ----------------------------------------------------

/**
 * Función genérica para hacer peticiones a la API de Match-V5 de Riot.
 * Incluye validación de clave y manejo básico de errores.
 */
async function riotApiRequest<T>(url: string, regionalRoute: string): Promise<T> {
    if (!RIOT_API_KEY) {
        throw new Error("RIOT_API_KEY no está definida en las variables de entorno.");
    }

    const headers = { 'X-Riot-Token': RIOT_API_KEY };
    // Las peticiones de partidas siempre van a /lol/match/v5/
    const fullUrl = `https://${regionalRoute}.api.riotgames.com/lol/match/v5/${url}`;

    try {
        const response = await axios.get(fullUrl, { headers });
        return response.data as T;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            let message = `Riot API responded with status ${status}.`;

            if (status === 429) {
                message = "Error 429: Rate Limit excedido. El cliente debe reintentar.";
            } else if (status === 404) {
                 message = `Recurso no encontrado (404) en la URL: ${fullUrl}`;
            }
            throw new Error(message);
        }
        
        // Manejo de errores que no son de Axios para satisfacer a TypeScript.
        const errorMessage = (error as Error).message || "Error desconocido al hacer la petición a Riot.";
        throw new Error(errorMessage);
    }
}

// ----------------------------------------------------
// Funciones de Riot API para Partidas
// ----------------------------------------------------

/**
 * Busca una lista de IDs de partidas recientes para un PUUID.
 * * @param puuid - PUUID del jugador.
 * @param regionalRoute - Ruta regional (ej: 'europe', 'americas').
 * @param noGames - Número de partidas a obtener.
 * @param queueId - ID de la cola (ej: 420 para Ranked Solo).
 */
export async function getMatchIds(
    puuid: string, 
    regionalRoute: string, 
    noGames: number, 
    queueId: number
): Promise<string[]> {
    const endpoint = 
        `matches/by-puuid/${puuid}/ids` +
        `?start=0&count=${noGames}&queue=${queueId}`;
        
    const matchIds = await riotApiRequest<string[]>(endpoint, regionalRoute);
    
    return matchIds;
}

/**
 * Obtiene los datos detallados de una partida.
 * * @param matchId - ID de la partida.
 * @param regionalRoute - Ruta regional (ej: 'europe', 'americas').
 * @returns Objeto con los datos completos de la partida.
 */
export async function getMatchData(matchId: string, regionalRoute: string): Promise<any> {
    const endpoint = `matches/${matchId}`;
    
    return riotApiRequest<any>(endpoint, regionalRoute);
}
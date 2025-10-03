// pages/api/riot/match-analysis.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getMatchIds, getMatchData } from '../../../services/riot-api'; 
import { findPlayerData } from '../../../services/riot-match-utils';

// --- DEFINICIÓN DE TIPOS PARA EL ANÁLISIS ---

interface MatchSummary {
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
}

interface ChampionStats {
    champion: string;
    games: number;
    killsAvg: number;
    deathsAvg: number;
    assistsAvg: number;
    winRate: number;
    kda: number; // (K+A) / D
}

interface FinalAnalysis {
    puuid: string;
    totalGamesAnalyzed: number;
    bestKDAChamp: ChampionStats | null;
    worstKDAChamp: ChampionStats | null;
    mostPlayedChamp: ChampionStats | null;
    highestKillGame: { champion: string, kills: number } | null;
    championAverages: ChampionStats[];
}

// --- MAPEO DE RUTAS REGIONALES ---
// Necesitas este mapa para que el usuario pueda usar 'euw1' pero la API use 'europe'
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


export default async function handler(req: NextApiRequest, res: NextApiResponse<FinalAnalysis | { error: string }>) {
    
    // 1. OBTENER Y VALIDAR PARÁMETROS
    const puuid = req.query.puuid as string;
    const regionLoL = req.query.regionLoL as string; // ej: euw1
    
    // Parámetros opcionales
    const noGames = parseInt(req.query.count as string) || 20;
    const queueId = parseInt(req.query.queue as string) || 420; // 420 = Ranked Solo Queue

    if (!puuid || !regionLoL) {
        return res.status(400).json({ 
            error: "Parámetros requeridos: puuid y regionLoL." 
        });
    }

    const regionalRoute = REGION_ROUTING[regionLoL.toLowerCase()];

    if (!regionalRoute) {
        return res.status(400).json({ error: 'Región de LoL no válida o no soportada.' });
    }

    try {
        // --- FASE 1: OBTENCIÓN DE DATOS RAW ---
        
        // Obtener IDs de partidas
        const matchIds = await getMatchIds(puuid, regionalRoute, noGames, queueId);
        
        // Obtener datos detallados de cada partida en paralelo
        const matchDataPromises = matchIds.map(matchId => getMatchData(matchId, regionalRoute));
        const allMatchData = await Promise.all(matchDataPromises);
        
        const rawMatchSummaries: MatchSummary[] = [];
        
        // Extraer los datos relevantes del jugador para cada partida
        for (const matchData of allMatchData) {
            // Usamos la función de utilidad para aislar los datos del jugador
            const playerData = findPlayerData(matchData, puuid); 
            
            rawMatchSummaries.push({
                champion: playerData.championName,
                kills: playerData.kills,
                deaths: playerData.deaths,
                assists: playerData.assists,
                win: playerData.win,
            });
        }
        
        if (rawMatchSummaries.length === 0) {
             return res.status(200).json({ 
                puuid, 
                totalGamesAnalyzed: 0,
                championAverages: [],
                bestKDAChamp: null,
                worstKDAChamp: null,
                mostPlayedChamp: null,
                highestKillGame: null,
            });
        }


        // --- FASE 2: ANÁLISIS DE DATOS (Simulación de Pandas) ---
        
        // 1. Agrupar y sumar por campeón (Similar a df.groupby('champion').agg({...}))
        const championGroups = rawMatchSummaries.reduce((acc, curr) => {
            if (!acc[curr.champion]) {
                acc[curr.champion] = { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalWins: 0, games: 0 };
            }
            acc[curr.champion].totalKills += curr.kills;
            acc[curr.champion].totalDeaths += curr.deaths;
            acc[curr.champion].totalAssists += curr.assists;
            acc[curr.champion].totalWins += (curr.win ? 1 : 0);
            acc[curr.champion].games += 1;
            return acc;
        }, {} as Record<string, { totalKills: number, totalDeaths: number, totalAssists: number, totalWins: number, games: number }>);
        
        // 2. Calcular promedios y KDA (Similar a df.groupby().mean())
        const championAverages: ChampionStats[] = Object.keys(championGroups).map(champ => {
            const stats = championGroups[champ];
            
            // KDA: (K+A) / D. Si muertes es 0, el KDA es (K+A).
            const kdaValue = stats.totalDeaths === 0 
                ? stats.totalKills + stats.totalAssists
                : (stats.totalKills + stats.totalAssists) / stats.totalDeaths;

            return {
                champion: champ,
                games: stats.games,
                killsAvg: parseFloat((stats.totalKills / stats.games).toFixed(2)),
                deathsAvg: parseFloat((stats.totalDeaths / stats.games).toFixed(2)),
                assistsAvg: parseFloat((stats.totalAssists / stats.games).toFixed(2)),
                winRate: parseFloat((stats.totalWins / stats.games).toFixed(3)),
                kda: parseFloat(kdaValue.toFixed(2)),
            };
        });
        
        
        // 3. Extraer estadísticas clave (Filtrado y Ordenamiento)
        
        // Filtrar campeones con 2 o más partidas jugadas (para estadísticas fiables)
        const filteredChamps = championAverages.filter(c => c.games >= 2);

        // Mejor/Peor KDA: ordenar por KDA (solo en campeones con 2+ juegos)
        const sortedByKDA = [...filteredChamps].sort((a, b) => b.kda - a.kda);
        const bestKDAChamp = sortedByKDA.length > 0 ? sortedByKDA[0] : null;
        const worstKDAChamp = sortedByKDA.length > 0 ? sortedByKDA[sortedByKDA.length - 1] : null;

        // Más jugado: ordenar por número de partidas (puede ser 1)
        const sortedByGames = [...championAverages].sort((a, b) => b.games - a.games);
        const mostPlayedChamp = sortedByGames.length > 0 ? sortedByGames[0] : null;

        // Partida con más kills: reduce para encontrar el máximo
        const highestKillGame = rawMatchSummaries.reduce((max, curr) => {
            return curr.kills > max.kills ? { champion: curr.champion, kills: curr.kills } : max;
        }, { champion: '', kills: -1 });


        // --- FASE 3: DEVOLVER ANÁLISIS FINAL ---

        const response: FinalAnalysis = {
            puuid, 
            totalGamesAnalyzed: rawMatchSummaries.length,
            bestKDAChamp,
            worstKDAChamp,
            mostPlayedChamp,
            highestKillGame: highestKillGame.kills !== -1 ? highestKillGame : null,
            championAverages: championAverages.sort((a, b) => b.games - a.games), // Ordenamos por más jugado
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error en la API Route /match-analysis:", error);
        
        // ----------------------------------------------------
        // LÍNEA CORREGIDA
        // ----------------------------------------------------
        // Accedemos a error.message solo si es un objeto Error conocido, 
        // de lo contrario, usamos un mensaje genérico.
        const errorMessage = (error instanceof Error) 
                             ? error.message 
                             : "Un error desconocido ha ocurrido durante el análisis.";
        
        res.status(500).json({ error: errorMessage });
    }
}
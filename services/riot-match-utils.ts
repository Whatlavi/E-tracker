// services/riot-match-utils.ts

/**
 * Función de utilidad para encontrar los datos específicos de un jugador 
 * dentro de la respuesta completa de una partida (MATCH-V5).
 * * @param matchData - Objeto de datos de la partida (respuesta completa de MATCH-V5).
 * @param puuid - PUUID del jugador a buscar.
 * @returns Objeto con los datos del jugador dentro de esa partida (kills, deaths, championName, etc.).
 */
export function findPlayerData(matchData: any, puuid: string): any {
    // metadata.participants es la lista de PUUIDs en el orden en que aparecen en info.participants
    const participantsPuuids: string[] = matchData?.metadata?.participants;
    
    if (!participantsPuuids) {
        throw new Error("Datos de partida inválidos: falta la lista de participantes (metadata.participants).");
    }

    // Encuentra el índice del jugador en la lista
    const playerIndex = participantsPuuids.findIndex(p => p === puuid);
    
    if (playerIndex === -1) {
        throw new Error(`PUUID ${puuid} no encontrado en la partida ID ${matchData?.metadata?.matchId}.`);
    }

    // Usa el índice para acceder a los datos detallados del jugador
    return matchData.info.participants[playerIndex];
}
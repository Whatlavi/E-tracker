import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Importamos los íconos
import { Zap, Trophy, Swords, User, BookOpen, ScrollText, Shield, LayoutGrid, BarChart3, Clock, TrendingUp, RotateCw } from 'lucide-react';

// Cargamos Tailwind CSS
const TailwindScript = () => (
    <script src="https://cdn.tailwindcss.com"></script>
);
// Configuramos la fuente Inter por defecto
TailwindScript();

// =================================================================
// 1. CONFIGURACIÓN Y LÓGICA DE RIOT API / DDRAGON
// =================================================================

// Riot API Key (Proporcionada por el usuario)
// ⚠️ ATENCIÓN: Esta clave es probablemente inválida o expirada. 
// Si ves Error 403, reemplázala por una clave ACTIVA.
const RIOT_API_KEY = "RGAPI-264f7afe-9de4-499c-86e1-bf4b0490320c"; 
const ACCOUNT_API_SERVER = "EUROPE"; // Para el Account API (puuid, match history), usa REGIONES (EUROPE, AMERICAS, ASIA)
const SUMMONER_API_SERVER = "EUW1"; // Para el Summoner API, usa PLATAFORMAS (EUW1, NA1, KR)
const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn/';
const VERSION_API_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const FALLBACK_VERSION = '14.19.1'; 
const DEFAULT_ICON_ID = 29;

// Tipo de datos para las estadísticas de Liga (Ranked)
interface LeagueStats {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
    winRate: string;
    mockRankIcon: string; // Ruta local para la imagen del rango
    totalMatches: number;
}

// Definimos el tipo de datos que vamos a devolver para el historial de partidas
interface MatchData {
    matchId: string;
    gameType: string;
    win: boolean;
    championName: string;
    kda: string; // Formato "K/D/A"
    gameDuration: string;
    championIconUrl: string;
    teamPosition: 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | 'NONE'; // Posición para calcular el rol principal
    gameEndTimestamp: number; // Para calcular "Última Actualización"
}

/**
 * Función auxiliar para realizar fetch con reintentos y manejar errores 403.
 */
const fetchWithRetry = async (url: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 403) {
                // Mensaje de error explícito para guiar al usuario
                throw new Error(`Error 403: API Key no válida o expirada. (Riot Games API)`);
            }
            if (!response.ok) {
                // Propagamos el error HTTP para que se maneje en el exterior, incluyendo el 404.
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            console.log(`Intento ${i + 1} fallido para ${url}. Reintentando...`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error("Fallo de red definitivo.");
};

/**
 * Calcula el KDA promedio a partir del historial de partidas.
 */
const calculateAverageKDA = (matches: MatchData[]): string => {
    if (matches.length === 0) return '0.00';

    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;

    matches.forEach(match => {
        // La kda string es 'kills/deaths/assists'
        const parts = match.kda.split('/').map(p => parseInt(p.trim(), 10));
        if (parts.length === 3) {
            totalKills += parts[0];
            totalDeaths += parts[1];
            totalAssists += parts[2];
        }
    });

    if (totalDeaths === 0) {
        if (totalKills > 0 || totalAssists > 0) return 'Perfect'; 
        return '0.00';
    }

    const kdaValue = (totalKills + totalAssists) / totalDeaths;
    return kdaValue.toFixed(2);
};

/**
 * Encuentra el campeón y rol principal de las partidas recientes.
 */
const findMainChampionAndRole = (matches: MatchData[]): { mainChampion: string, mainRole: string } => {
    if (matches.length === 0) return { mainChampion: 'N/A', mainRole: 'N/A' };

    const championCounts: { [key: string]: number } = {};
    const roleCounts: { [key: string]: number } = {};

    matches.forEach(match => {
        championCounts[match.championName] = (championCounts[match.championName] || 0) + 1;
        
        if (match.teamPosition !== 'NONE') {
            roleCounts[match.teamPosition] = (roleCounts[match.teamPosition] || 0) + 1;
        }
    });

    let mainChampion = 'N/A';
    let maxChampCount = 0;
    for (const champ in championCounts) {
        if (championCounts[champ] > maxChampCount) {
            maxChampCount = championCounts[champ];
            mainChampion = champ;
        }
    }

    let mainRole = 'NONE';
    let maxRoleCount = 0;
    for (const role in roleCounts) {
        if (roleCounts[role] > maxRoleCount) {
            maxRoleCount = roleCounts[role];
            mainRole = role;
        }
    }
    
    // Mapeo de Riot API a nombres en español
    const roleMap: { [key: string]: string } = {
        'TOP': 'Top',
        'JUNGLE': 'Jungla',
        'MIDDLE': 'Medio',
        'BOTTOM': 'Bot',
        'UTILITY': 'Soporte',
        'NONE': 'Flexible'
    };
    
    return { 
        mainChampion: mainChampion, 
        mainRole: roleMap[mainRole] || 'Flexible' 
    };
};

/**
 * Formatea el tiempo transcurrido desde el último partido.
 */
const timeSinceLastMatch = (timestampMs: number): string => {
    if (timestampMs === 0) return 'Nunca';
    
    const seconds = Math.floor((Date.now() - timestampMs) / 1000);
    let interval = seconds / 31536000;
    
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? ' año' : ' años');
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? ' mes' : ' meses');
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? ' día' : ' días');
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? ' hora' : ' horas');
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? ' minuto' : ' minutos');
    
    return 'Hace poco';
};

/**
 * Obtiene el nombre del campeón, KDA, y posición de un jugador en una partida específica.
 */
const getMatchDetails = (matchData: any, puuid: string, ddragonVersion: string): MatchData => {
    const participant = matchData.info.participants.find((p: any) => p.puuid === puuid);
    
    if (!participant) {
        // Fallback si no se encuentra el participante
        return {
            matchId: matchData.metadata.matchId, gameType: 'Desconocido', win: false, championName: 'No Encontrado', 
            kda: 'N/A', gameDuration: 'N/A', championIconUrl: `${DDRAGON_BASE_URL}${ddragonVersion}/img/champion/Summoner.png`,
            teamPosition: 'NONE', gameEndTimestamp: matchData.info.gameEndTimestamp || 0
        };
    }
    
    const { kills, deaths, assists, championName, teamPosition } = participant;
    const kdaString = `${kills}/${deaths}/${assists}`;
    
    const durationSeconds = matchData.info.gameDuration;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const gameDuration = `${minutes} min ${seconds} seg`;
    
    let gameType = matchData.info.queueId;
    if (gameType === 420) gameType = 'Ranked Solo/Duo';
    else if (gameType === 400) gameType = 'Normal Draft';
    else if (gameType === 430) gameType = 'Normal Blind';
    else if (gameType === 440) gameType = 'Ranked Flex';
    else if (gameType === 450) gameType = 'ARAM';
    else gameType = 'Otros';
    
    const championIconUrl = `${DDRAGON_BASE_URL}${ddragonVersion}/img/champion/${championName}.png`;

    return {
        matchId: matchData.metadata.matchId,
        gameType: gameType,
        win: participant.win,
        championName: championName,
        kda: kdaString,
        gameDuration: gameDuration,
        championIconUrl: championIconUrl,
        teamPosition: teamPosition || 'NONE',
        gameEndTimestamp: matchData.info.gameEndTimestamp || 0,
    };
};

/**
 * Obtiene el rango real del jugador (Solo/Duo) usando el puuid.
 */
const getLeagueDataFromRiot = async (puuid: string): Promise<LeagueStats> => {
    // API League-v4: /lol/league/v4/entries/by-puuid/{puuid}
    const leagueApiUrl = `https://${SUMMONER_API_SERVER}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
    
    const leagueResponse = await fetchWithRetry(leagueApiUrl);
    const leagueEntries = await leagueResponse.json();
    
    // Buscar la entrada de Solo/Duo (queueType 'RANKED_SOLO_5x5')
    const soloDuoEntry = leagueEntries.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
    
    if (!soloDuoEntry) {
        // Retorna UNRANKED si no se encuentra la entrada de Solo/Duo
        return {
            tier: 'UNRANKED', rank: '', leaguePoints: 0, wins: 0, losses: 0, winRate: 'N/A', 
            mockRankIcon: '/ranks/unranked.png', totalMatches: 0,
        };
    }
    
    const { tier, rank, leaguePoints, wins, losses } = soloDuoEntry;
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? `${Math.round((wins / totalMatches) * 100)}%` : '0%';
    
    // Convertir el tier a minúsculas para la ruta de la imagen local (ej: DIAMOND -> /ranks/diamond.png)
    const tierLower = tier.toLowerCase();
    
    return {
        tier: tier,
        rank: rank,
        leaguePoints: leaguePoints,
        wins: wins,
        losses: losses,
        winRate: winRate,
        mockRankIcon: `/ranks/${tierLower}.png`, 
        totalMatches: totalMatches,
    };
};


/**
 * Realiza las llamadas REALES a la API de Riot Games para obtener todos los datos del invocador.
 */
const getSummonerDataFromRiot = async (gameName: string, tagLine: string, ddragonVersion: string) => {
    
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);

    // 1. Obtener PUUID (API Account)
    const accountApiUrl = `https://${ACCOUNT_API_SERVER}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}?api_key=${RIOT_API_KEY}`;
    
    const accountResponse = await fetchWithRetry(accountApiUrl);
    const accountData = await accountResponse.json();
    const puuid = accountData.puuid; 

    if (!puuid) {
        throw new Error("No se pudo obtener el PUUID.");
    }

    const encodedPuuid = encodeURIComponent(puuid);

    // 2. Obtener Icon ID y Nivel (API Summoner)
    const summonerApiUrl = `https://${SUMMONER_API_SERVER}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodedPuuid}?api_key=${RIOT_API_KEY}`;
    
    const summonerResponse = await fetchWithRetry(summonerApiUrl);
    const summonerData = await summonerResponse.json();
    
    if (!summonerData.profileIconId || summonerData.summonerLevel === undefined) {
        throw new Error("No se encontró el ID de ícono o el Nivel del invocador.");
    }

    // 3. OBTENER DATOS DE LIGA (RANKED REAL)
    let leagueData: LeagueStats;
    try {
        leagueData = await getLeagueDataFromRiot(puuid);
    } catch (e) {
        console.error("Fallo al obtener datos de Liga. Usando UNRANKED por defecto.", e);
        // Fallback de datos de liga
        leagueData = {
            tier: 'UNRANKED', rank: '', leaguePoints: 0, wins: 0, losses: 0, winRate: 'N/A', mockRankIcon: '/ranks/unranked.png', totalMatches: 0
        };
    }

    // 4. Obtener los últimos 5 Match IDs (API Match)
    const matchHistoryUrl = `https://${ACCOUNT_API_SERVER}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?start=0&count=5&api_key=${RIOT_API_KEY}`;
    
    const matchHistoryResponse = await fetchWithRetry(matchHistoryUrl);
    const matchIds: string[] = await matchHistoryResponse.json();
    
    // 5. Obtener los detalles de cada partida
    const matchDetailsPromises = matchIds.map(matchId => {
        const matchDetailsUrl = `https://${ACCOUNT_API_SERVER}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`;
        return fetchWithRetry(matchDetailsUrl).then(res => res.json());
    });
    
    const rawMatchDetails = await Promise.all(matchDetailsPromises);
    
    // 6. Procesar los detalles para obtener el formato deseado
    const matchHistory: MatchData[] = rawMatchDetails.map(matchDetail => 
        getMatchDetails(matchDetail, puuid, ddragonVersion)
    );
    
    return { 
        profileIconId: summonerData.profileIconId, 
        name: summonerData.name,
        summonerLevel: summonerData.summonerLevel,
        matchHistory: matchHistory, 
        leagueStats: leagueData, // DEVOLVER DATOS DE LIGA REALES
    };
};

// =================================================================
// 2. HOOK PERSONALIZADO: useSummonerIcon (Contiene toda la información real)
// =================================================================

interface IconState {
    iconId: number;
    iconUrl: string;
    loading: boolean;
    error: string | null;
    gameVersion: string;
    summonerLevel: number; 
    matchHistory: MatchData[]; 
    matchHistoryLoading: boolean;
    matchHistoryError: string | null;
    leagueStats: LeagueStats | null; // **DATOS REALES**
    averageKda: string; // **DATO REAL**
    mainChampion: string; // **DATO REAL**
    mainRole: string; // **DATO REAL**
    lastUpdateTime: string; // **DATO REAL** (tiempo desde la última partida)
}

let state: IconState;

const useSummonerIcon = (gameName: string | null, tagLine: string | null): IconState => {
    const [localState, setLocalState] = useState<IconState>({
        iconId: DEFAULT_ICON_ID,
        iconUrl: `${DDRAGON_BASE_URL}${FALLBACK_VERSION}/img/profileicon/${DEFAULT_ICON_ID}.png`,
        loading: false,
        error: null,
        gameVersion: FALLBACK_VERSION,
        summonerLevel: 0,
        matchHistory: [],
        matchHistoryLoading: false,
        matchHistoryError: null,
        leagueStats: null,
        averageKda: '0.00',
        mainChampion: 'N/A',
        mainRole: 'N/A',
        lastUpdateTime: 'N/A',
    });
    
    state = localState;

    const fetchIcon = useCallback(async (gn: string, tag: string) => {
        setLocalState(prev => ({ 
            ...prev, 
            loading: true, 
            error: null, 
            matchHistoryLoading: true, 
            matchHistoryError: null,
            matchHistory: [],
            leagueStats: null,
            averageKda: '...',
            mainChampion: '...',
            mainRole: '...',
            lastUpdateTime: '...',
        }));
        
        let currentVersion = FALLBACK_VERSION;
        
        // --- Paso 1: Obtener la versión más reciente del juego ---
        try {
            const versionResponse = await fetchWithRetry(VERSION_API_URL);
            const versions = await versionResponse.json();
            if (versions && versions.length > 0) {
                currentVersion = versions[0]; 
            }
        } catch (error) {
            console.error("Fallo al obtener la versión de DDragon. Usando fallback.", error);
        }
        
        setLocalState(prev => ({ ...prev, gameVersion: currentVersion }));

        // --- Paso 2: Obtener datos del invocador, Partidas y Rango (LLAMADA REAL) ---
        try {
            const data = await getSummonerDataFromRiot(gn, tag, currentVersion);
            
            // **Cálculo de datos reales basados en el historial de partidas**
            const calculatedKda = calculateAverageKDA(data.matchHistory);
            const { mainChampion, mainRole } = findMainChampionAndRole(data.matchHistory);
            
            let lastMatchTimestamp = 0;
            if (data.matchHistory.length > 0) {
                // El partido más reciente es el primero en la lista (si la API lo ordena por defecto)
                lastMatchTimestamp = data.matchHistory[0].gameEndTimestamp;
            }
            const lastUpdateText = timeSinceLastMatch(lastMatchTimestamp);

            // Éxito: Actualizar el estado con todos los datos REALES
            const url = `${DDRAGON_BASE_URL}${currentVersion}/img/profileicon/${data.profileIconId}.png`;
            
            setLocalState(prev => ({
                ...prev,
                iconId: data.profileIconId,
                iconUrl: url,
                loading: false,
                summonerLevel: data.summonerLevel,
                matchHistory: data.matchHistory,
                matchHistoryLoading: false,
                matchHistoryError: null,
                leagueStats: data.leagueStats, 
                averageKda: calculatedKda,
                mainChampion: mainChampion,
                mainRole: mainRole,
                lastUpdateTime: lastUpdateText,
            }));

        } catch (error) {
            const errorMessage = (error as Error).message;
            console.error("La llamada REAL a la API de Riot falló:", errorMessage);
            
            // Fallo: Mostrar error y usar datos por defecto/previos
            setLocalState(prev => ({ 
                ...prev, 
                error: `API FALLIDA: ${errorMessage}. Si ves Error 403, tu clave de Riot expiró y debe ser reemplazada.`,
                loading: false,
                matchHistoryLoading: false,
                matchHistoryError: `No se pudo cargar el historial de partidas: ${errorMessage}`,
                // Fallback para los stats de Liga (UNRANKED / 0 LP)
                leagueStats: {
                    tier: 'UNRANKED', rank: '', leaguePoints: 0, wins: 0, losses: 0, winRate: 'N/A', mockRankIcon: '/ranks/unranked.png', totalMatches: 0
                },
                averageKda: 'N/A',
                mainChampion: 'N/A',
                mainRole: 'N/A',
                lastUpdateTime: 'N/A',
            }));
        }

    }, []);

    useEffect(() => {
        if (gameName && tagLine) {
            fetchIcon(gameName, tagLine);
        } else {
            // Resetear
             setLocalState(prev => ({
                 iconId: DEFAULT_ICON_ID,
                 iconUrl: `${DDRAGON_BASE_URL}${prev.gameVersion}/img/profileicon/${DEFAULT_ICON_ID}.png`,
                 loading: false,
                 error: null,
                 gameVersion: prev.gameVersion,
                 summonerLevel: 0,
                 matchHistory: [],
                 matchHistoryLoading: false,
                 matchHistoryError: null,
                 leagueStats: null,
                 averageKda: '0.00',
                 mainChampion: 'N/A',
                 mainRole: 'N/A',
                 lastUpdateTime: 'N/A',
               }));
        }
    }, [gameName, tagLine, fetchIcon]);

    return localState;
};

// =================================================================
// 3. COMPONENTE: ProfileIconDisplay (Para el Navbar)
// =================================================================

interface ProfileIconDisplayProps {
    gameName: string | null;
    tagLine: string | null;
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const ProfileIconDisplay: React.FC<ProfileIconDisplayProps> = ({ gameName, tagLine, onNavigate }) => {
    
    // Solo necesitamos el estado de carga/error para el navbar
    const { iconUrl, loading, iconId, error } = useSummonerIcon(gameName, tagLine);

    if (!gameName || !tagLine) {
        return (
             <a 
                 href="#"
                 onClick={() => onNavigate('/login')}
                 className="text-gray-300 hover:bg-gray-800 hover:text-white p-2 rounded-full transition duration-150 shadow-md flex items-center"
                 aria-label="Iniciar sesión o ver perfil"
             >
                 <User className="w-6 h-6 text-teal-400" />
             </a>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg">
                <RotateCw className="w-6 h-6 text-teal-400 animate-spin" />
                <span className="text-sm text-gray-400 hidden sm:inline">Cargando Icono...</span>
            </div>
        );
    }
    
    return (
        <a 
            href="#"
            onClick={() => onNavigate('profile', gameName, tagLine)}
            className="flex items-center space-x-2 p-1 pr-3 bg-gray-800 rounded-full hover:bg-gray-700 transition duration-150 shadow-md border border-gray-700"
            title={`Perfil: ${gameName}#${tagLine} (ID: ${iconId})`}
        >
            <img 
                src={iconUrl} 
                alt={`${gameName}'s Icon`} 
                className="w-8 h-8 rounded-full border-2 border-teal-500 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `${DDRAGON_BASE_URL}${state.gameVersion || FALLBACK_VERSION}/img/profileicon/${DEFAULT_ICON_ID}.png`; }} 
            />
            <span className="text-sm font-semibold text-white hidden md:inline">{gameName}</span>
        </a>
    );
};

// =================================================================
// 4. NUEVO COMPONENTE: MatchHistoryDisplay
// =================================================================

interface MatchHistoryDisplayProps {
    matchHistory: MatchData[];
    loading: boolean;
    error: string | null;
}

const MatchHistoryDisplay: React.FC<MatchHistoryDisplayProps> = ({ matchHistory, loading, error }) => {
    if (loading) {
        return (
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 text-center text-teal-400">
                <RotateCw className="w-6 h-6 inline-block mr-2 animate-spin" />
                Cargando historial de partidas...
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg shadow-xl font-semibold">
                ⚠️ Error al cargar el historial: {error}
            </div>
        );
    }

    if (matchHistory.length === 0) {
        return (
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 text-center text-gray-400">
                No se encontraron partidas recientes.
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-4 space-y-3">
            {matchHistory.map((match) => (
                <div 
                    key={match.matchId} 
                    className={`flex justify-between items-center p-3 rounded-lg transition cursor-pointer 
                                ${match.win ? 'bg-green-900/30 hover:bg-green-900/50 border-l-4 border-green-500' : 'bg-red-900/30 hover:bg-red-900/50 border-l-4 border-red-500'}`
                              }
                >
                    <div className="flex items-center">
                        <span className={`text-sm font-bold w-20 ${match.win ? 'text-green-400' : 'text-red-400'}`}>
                            {match.win ? 'VICTORIA' : 'DERROTA'}
                        </span>
                        <span className="mx-4 text-gray-400">|</span>
                        
                        <img 
                            src={match.championIconUrl} 
                            alt={match.championName} 
                            className="w-10 h-10 rounded-md mr-4 border border-gray-600"
                        />
                        
                        <div>
                            <p className="font-semibold">{match.championName} - {match.gameType}</p>
                            <p className="text-xs text-gray-400">KDA: {match.kda} | Duración: {match.gameDuration}</p>
                        </div>
                    </div>
                    <button className="text-sm text-teal-400 hover:text-teal-300 opacity-80 hover:opacity-100">Ver Detalles</button>
                </div>
            ))}
        </div>
    );
};

// =================================================================
// 5. COMPONENTE: PLAYER PROFILE PAGE
// =================================================================

interface PlayerProfilePageProps {
    gameName: string;
    tagLine: string;
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ gameName, tagLine, onNavigate }) => {
    const simulatedUrl = `/lol/profile/riot/${gameName}%23${tagLine}/overview`;
    
    // OBTENEMOS TODOS LOS DATOS REALES DEL HOOK
    const { 
        iconUrl, 
        loading, 
        iconId, 
        error, 
        summonerLevel, 
        matchHistory, 
        matchHistoryLoading, 
        matchHistoryError,
        leagueStats,
        averageKda,
        mainChampion,
        mainRole,
        lastUpdateTime // **Dato Real**
    } = useSummonerIcon(gameName, tagLine);
    
    // Mapeamos los datos reales del estado a las propiedades del perfil
    const profileStats = useMemo(() => {
        const fallbackRank = { tier: 'UNRANKED', rank: '', leaguePoints: 0, wins: 0, losses: 0, winRate: 'N/A', mockRankIcon: '/ranks/unranked.png', totalMatches: 0 };
        const stats = leagueStats || fallbackRank;
        
        return {
            // **DATOS REALES DE LIGA**
            rank: `${stats.tier} ${stats.rank}`, 
            lp: stats.leaguePoints,
            winRate: stats.winRate,
            totalMatches: stats.totalMatches,
            mockRankIcon: stats.mockRankIcon,
            
            // **DATOS REALES CALCULADOS**
            kda: averageKda, 
            mainRole: mainRole,
            mainChampion: mainChampion,
            lastUpdate: lastUpdateTime,
        };
    }, [leagueStats, averageKda, mainRole, mainChampion, lastUpdateTime]);

    // Usamos las estadísticas reales y calculadas para las tarjetas
    const statCards = [
        { icon: TrendingUp, title: 'KDA Promedio', value: loading ? '...' : profileStats.kda, color: 'text-red-400' },
        { icon: BarChart3, title: 'Tasa de Victorias (Ranked)', value: loading ? '...' : profileStats.winRate, color: 'text-green-400' },
        { icon: LayoutGrid, title: 'Partidas Jugadas (Ranked)', value: loading ? '...' : profileStats.totalMatches.toString(), color: 'text-yellow-400' },
        { icon: Clock, title: 'Última Partida', value: loading ? '...' : profileStats.lastUpdate, color: 'text-blue-400' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 pt-20 pb-10 text-white font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* NOTIFICACIÓN DE ERROR DE API PRINCIPAL */}
                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-sm font-semibold">
                        ⚠️ Fallo en datos de Invocador: {error}
                    </div>
                )}

                <p className="text-gray-500 text-xs mb-4">
                    Ruta simulada: <span className="font-mono bg-gray-800 p-1 rounded text-teal-400">{simulatedUrl}</span>
                </p>

                {/* HEADER DEL PERFIL */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row items-center border-t-4 border-teal-500">
                    
                    {/* Icono de Perfil y Campeón Principal */}
                    <div className="relative mb-4 md:mb-0 md:mr-6">
                        {loading ? (
                            <div className="w-24 h-24 rounded-full border-4 border-gray-600 flex items-center justify-center bg-gray-700">
                                <RotateCw className="w-10 h-10 text-teal-400 animate-spin" />
                            </div>
                        ) : (
                            <img 
                                src={iconUrl} 
                                alt="Icono de Perfil del Jugador" 
                                className="w-24 h-24 rounded-full border-4 border-gray-600 object-cover transition-opacity duration-300"
                                onError={(e) => { (e.target as HTMLImageElement).src = `${DDRAGON_BASE_URL}${state.gameVersion || FALLBACK_VERSION}/img/profileicon/${DEFAULT_ICON_ID}.png`; }}
                            />
                        )}
                        
                        <div className="absolute -bottom-2 -right-2 bg-gray-900 p-1.5 rounded-full border-4 border-teal-500 shadow-xl min-w-[3rem] text-center">
                            <span className="text-xs font-extrabold text-white">LVL {loading ? '...' : summonerLevel}</span>
                        </div>
                    </div>

                    {/* Información Principal */}
                    <div className="text-center md:text-left flex-grow">
                        <h1 className="text-4xl font-extrabold mb-1">
                            {gameName}
                            <span className="text-gray-400 text-xl font-normal ml-2">#{tagLine}</span>
                        </h1>
                        {/* **DATO REAL** */}
                        <p className="text-lg text-gray-300 font-medium">Rol Principal: <span className="text-teal-400 font-semibold">{loading ? '...' : profileStats.mainRole}</span></p>
                        {/* **DATO REAL** */}
                        <p className="text-sm text-gray-500 mt-1">Campeón Más Jugado: {loading ? '...' : profileStats.mainChampion} (ID de Ícono: {iconId})</p>
                    </div>

                    {/* STATS DE RANKED (REALES) */}
                    <div className="mt-6 md:mt-0 p-4 bg-gray-700 rounded-lg flex items-center shadow-inner">
                        {loading ? (
                            <RotateCw className="w-16 h-16 mr-4 text-teal-400 animate-spin" />
                        ) : (
                             <img 
                                // **DATO REAL: Ruta LOCAL según el tier de la API**
                                src={profileStats.mockRankIcon} 
                                alt="Rango" 
                                className="w-16 h-16 mr-4"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/ranks/unranked.png'; }} 
                            />
                        )}
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Ranked Solo/Duo</p>
                            {/* **DATO REAL** */}
                            <p className="text-xl font-bold text-yellow-300">{loading ? '...' : profileStats.rank}</p>
                            {/* **DATO REAL** */}
                            <p className="text-2xl font-extrabold text-white">{loading ? '...' : profileStats.lp} LP</p>
                            {/* **DATO REAL** */}
                            <p className="text-sm text-gray-400">Tasa de Victorias: {loading ? '...' : profileStats.winRate}</p>
                        </div>
                    </div>
                </div>

                {/* CUERPO - Tarjetas de Estadísticas (REALES) */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, index) => (
                        <div key={index} className="bg-gray-800 p-5 rounded-lg shadow-xl border-l-4 border-teal-500 transition hover:bg-gray-700">
                            <div className="flex items-center mb-3">
                                <card.icon className={`w-6 h-6 mr-3 ${card.color}`} />
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{card.title}</h3>
                            </div>
                            <p className="text-3xl font-extrabold">{card.value}</p> 
                        </div>
                    ))}
                </div>

                {/* SECCIÓN DE PARTIDAS (REAL) */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-teal-400 border-b border-gray-700 pb-2 mb-4">Últimas 5 Partidas</h2>
                    <MatchHistoryDisplay 
                        matchHistory={matchHistory} 
                        loading={matchHistoryLoading} 
                        error={matchHistoryError} 
                    />
                </div>

                {/* Botón de Regreso */}
                    <div className="mt-8 text-center">
                    <button 
                        onClick={() => onNavigate('home')} 
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full transition duration-150 flex items-center mx-auto"
                    >
                        <User className="w-4 h-4 mr-2"/> Volver a la Home
                    </button>
                </div>
            </div>
        </div>
    );
};


// =================================================================
// 6. COMPONENTES NO AFECTADOS (SearchBar, Navbar, App)
// =================================================================

interface FunctionalSearchBarProps {
    onSearch: (gameName: string, tagLine: string) => void;
    loading: boolean;
    initialValue?: string;
}

const FunctionalSearchBar: React.FC<FunctionalSearchBarProps> = ({ onSearch, loading, initialValue = '' }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialValue) {
            setInputValue(initialValue);
        } else {
            setInputValue('');
        }
    }, [initialValue]);

    const handleSearchExecution = useCallback((input: string) => {
        setError(null);
        const trimmedId = input.trim();
        const parts = trimmedId.split('#');

        if (parts.length !== 2) {
            return setError('Formato incorrecto. Usa NombreDeJuego#TAG (ej: YIKARMAIY#EUW)');
        }

        const gameName = parts[0].trim();
        const tagLine = parts[1].trim();

        if (!gameName || !tagLine) {
            return setError('Nombre o Etiqueta vacíos.');
        }

        onSearch(gameName, tagLine);
        setInputValue(`${gameName}#${tagLine}`);
    }, [onSearch]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading) {
            handleSearchExecution(inputValue);
        }
    };
    
    return (
        <div className="relative w-64">
            <form onSubmit={handleFormSubmit} className="flex">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError(null);
                    }}
                    placeholder="Buscar Riot ID#TAG..."
                    className="pl-10 pr-4 py-1.5 text-sm w-full bg-gray-800 text-white rounded-md border border-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition duration-150"
                    disabled={loading}
                />
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            {error && (
                <div className="absolute z-50 w-full mt-1 bg-red-900 border border-red-700 rounded-lg shadow-2xl p-2 right-0">
                    <p className="text-red-300 font-semibold text-xs">{error}</p>
                </div>
            )}
        </div>
    );
};


interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface PlayerData {
    gameName: string;
    tagLine: string;
}

interface NavbarProps {
    currentPath: string;
    activePlayer: PlayerData | null; 
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, activePlayer, onNavigate }) => {
    const navItems: NavItem[] = [
        { name: 'CAMPEONES', href: '/champions', icon: BookOpen },
        { name: 'NOTAS DEL PARCHE', href: '/patch-notes', icon: ScrollText },
        { name: 'RANKING', href: '/ranking', icon: Trophy },
        { name: 'E-SPORTS', href: '/esports', icon: Shield },
        { name: 'PvP', href: '/pvp', icon: Swords },
    ];

    const initialSearchValue = activePlayer ? `${activePlayer.gameName}#${activePlayer.tagLine}` : '';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black shadow-xl border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <a 
                            href="#"
                            onClick={() => onNavigate('home')} 
                            className="text-2xl font-extrabold text-white tracking-wider hover:text-gray-300 transition duration-150"
                        >
                            Elitegg
                        </a>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => onNavigate(item.href)}
                                className={`text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center
                                    ${item.href === currentPath ? 'bg-gray-800 text-white border-b-2 border-teal-500' : ''}
                                `}
                                aria-current={item.href === currentPath ? 'page' : undefined}
                            >
                                <item.icon className="w-4 h-4 mr-1 text-teal-400" />
                                {item.name}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="hidden lg:block">
                            <FunctionalSearchBar 
                                onSearch={(gn, tag) => onNavigate('profile', gn, tag)} 
                                loading={false} 
                                initialValue={initialSearchValue}
                            />
                        </div>

                        <ProfileIconDisplay 
    gameName={activePlayer?.gameName || null} 
    tagLine={activePlayer?.tagLine || null} 
    onNavigate={onNavigate} // <- CORREGIDO: Se usa la variable 'onNavigate'
/>
                    </div>
                </div>
            </div>
        </nav>
    );
};


const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="min-h-screen bg-gray-900 pt-20 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold text-teal-400 mb-4">{title}</h1>
        <p className="text-gray-400">Esta es una página de ejemplo. Usa la barra de búsqueda para ver un perfil de jugador!</p>
    </div>
);


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'home' | 'profile' | string>('home');
    const [activePlayer, setActivePlayer] = useState<PlayerData | null>(null);

    const navigate = useCallback((view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => {
        if (view === 'profile' && gameName && tagLine) {
            setActivePlayer({ gameName, tagLine });
            setCurrentView('profile');
        } else if (view === 'home') {
            setCurrentView('home');
        } else {
             setCurrentView(view);
        }
    }, []);
    
    const renderContent = () => {
        switch (currentView) {
            case 'profile':
                if (activePlayer) {
                    return (
                        <PlayerProfilePage 
                            gameName={activePlayer.gameName} 
                            tagLine={activePlayer.tagLine} 
                            onNavigate={navigate}
                        />
                    );
                }
                navigate('home');
                return null; 
            case 'home':
                return (
                    <div className="min-h-screen bg-gray-900 pt-20 flex flex-col items-center justify-center text-white p-4">
                        <h1 className="text-5xl font-extrabold text-teal-400 mb-4">Bienvenido a Elitegg Tracker</h1>
                        <p className="text-xl text-gray-300 mb-10 text-center">
                            Busca un jugador por su <span className="font-mono bg-gray-800 p-1 rounded text-red-300">Riot ID#TAG</span> en la barra de navegación.
                        </p>
                        <div className="lg:hidden">
                            <FunctionalSearchBar onSearch={(gn, tag) => navigate('profile', gn, tag)} loading={false} />
                        </div>
                    </div>
                );
            case '/ranking':
            case '/champions':
            case '/patch-notes':
            case '/esports':
            case '/pvp':
            case '/login':
                return <PlaceholderPage title={currentView.substring(1).toUpperCase()} />;
            default:
                return <PlaceholderPage title="Página No Encontrada" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar 
                currentPath={currentView} 
                activePlayer={activePlayer} 
                onNavigate={navigate} 
            />
            <main>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
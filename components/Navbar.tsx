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
// NOTA IMPORTANTE: Esta clave debe ser válida y no haber expirado. Las claves de desarrollo duran 24 horas.
const RIOT_API_KEY = "RGAPI-dae4ca30-ced5-4409-a3fd-31021504ae21"; 
const ACCOUNT_API_SERVER = "EUROPE"; // Para el Account API (puuid, match history), usa REGIONES (EUROPE, AMERICAS, ASIA)
const SUMMONER_API_SERVER = "EUW1"; // Para el Summoner API, usa PLATAFORMAS (EUW1, NA1, KR)
const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn/';
const VERSION_API_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const FALLBACK_VERSION = '14.19.1'; 
const DEFAULT_ICON_ID = 29;

// Definimos el tipo de datos que vamos a devolver para el historial de partidas
interface MatchData {
    matchId: string;
    gameType: string;
    win: boolean;
    championName: string;
    kda: string;
    gameDuration: string;
    championIconUrl: string;
}

/**
 * Función auxiliar para realizar fetch con reintentos y manejar errores 403.
 */
const fetchWithRetry = async (url: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 403) {
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
 * Obtiene el nombre del campeón y el KDA de un jugador en una partida específica.
 */
const getMatchDetails = (matchData: any, puuid: string, ddragonVersion: string): MatchData => {
    // 1. Encontrar la información del jugador en los participantes
    const participant = matchData.info.participants.find((p: any) => p.puuid === puuid);
    
    if (!participant) {
        return {
            matchId: matchData.metadata.matchId,
            gameType: 'Desconocido',
            win: false,
            championName: 'No Encontrado',
            kda: 'N/A',
            gameDuration: 'N/A',
            championIconUrl: `${DDRAGON_BASE_URL}${ddragonVersion}/img/champion/Summoner.png` // Ícono genérico
        };
    }
    
    // 2. Extraer KDA
    const kills = participant.kills;
    const deaths = participant.deaths;
    const assists = participant.assists;
    const kdaString = `${kills}/${deaths}/${assists}`;
    
    // 3. Extraer duración y tipo de juego
    const durationSeconds = matchData.info.gameDuration;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const gameDuration = `${minutes} min ${seconds} seg`;
    
    let gameType = matchData.info.queueId;
    // Esto es simplificado. Se debería mapear queueId a un nombre legible (Ranked Solo/Duo, Normal, ARAM, etc.)
    if (gameType === 420) gameType = 'Ranked Solo/Duo';
    else if (gameType === 400) gameType = 'Normal Draft';
    else if (gameType === 430) gameType = 'Normal Blind';
    else if (gameType === 440) gameType = 'Ranked Flex';
    else if (gameType === 450) gameType = 'ARAM';
    else gameType = 'Otros';
    
    // 4. Construir URL del ícono del campeón
    const championName = participant.championName;
    const championIconUrl = `${DDRAGON_BASE_URL}${ddragonVersion}/img/champion/${championName}.png`;

    return {
        matchId: matchData.metadata.matchId,
        gameType: gameType,
        win: participant.win,
        championName: championName,
        kda: kdaString,
        gameDuration: gameDuration,
        championIconUrl: championIconUrl,
    };
};

/**
 * Realiza las llamadas REALES a la API de Riot Games para obtener el profileIconId, nivel y partidas.
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
        if (accountData.status && accountData.status.status_code === 404) {
            throw new Error("Invocador no encontrado. Verifica Nombre y Tagline.");
        }
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

    // *** NUEVOS CAMBIOS CLAVE 1: Lógica para obtener el historial de partidas ***
    
    // 3. Obtener los últimos 5 Match IDs (API Match)
    const matchHistoryUrl = `https://${ACCOUNT_API_SERVER}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?start=0&count=5&api_key=${RIOT_API_KEY}`;
    
    const matchHistoryResponse = await fetchWithRetry(matchHistoryUrl);
    const matchIds: string[] = await matchHistoryResponse.json();
    
    // 4. Obtener los detalles de cada partida
    const matchDetailsPromises = matchIds.map(matchId => {
        const matchDetailsUrl = `https://${ACCOUNT_API_SERVER}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`;
        return fetchWithRetry(matchDetailsUrl).then(res => res.json());
    });
    
    const rawMatchDetails = await Promise.all(matchDetailsPromises);
    
    // 5. Procesar los detalles para obtener el formato deseado
    const matchHistory: MatchData[] = rawMatchDetails.map(matchDetail => 
        getMatchDetails(matchDetail, puuid, ddragonVersion)
    );
    // *** FIN NUEVOS CAMBIOS CLAVE 1 ***
    

    return { 
        profileIconId: summonerData.profileIconId, 
        name: summonerData.name,
        summonerLevel: summonerData.summonerLevel,
        // *** NUEVOS CAMBIOS CLAVE 2: Devolver el historial de partidas ***
        matchHistory: matchHistory, 
    };
};

// =================================================================
// 2. HOOK PERSONALIZADO: useSummonerIcon
// =================================================================

interface IconState {
    iconId: number;
    iconUrl: string;
    loading: boolean;
    error: string | null;
    gameVersion: string;
    summonerLevel: number; 
    // *** NUEVOS CAMBIOS CLAVE 3: Nuevo campo para el historial de partidas ***
    matchHistory: MatchData[]; 
    matchHistoryLoading: boolean;
    matchHistoryError: string | null;
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
        // *** NUEVOS CAMBIOS CLAVE 4: Inicializar el historial de partidas y estados ***
        matchHistory: [],
        matchHistoryLoading: false,
        matchHistoryError: null,
    });
    
    state = localState;

    const fetchIcon = useCallback(async (gn: string, tag: string) => {
        setLocalState(prev => ({ 
            ...prev, 
            loading: true, 
            error: null, 
            matchHistoryLoading: true, // Empezar a cargar el historial también
            matchHistoryError: null,
            matchHistory: [],
        }));
        
        let currentVersion = FALLBACK_VERSION;
        let finalIconId = DEFAULT_ICON_ID;
        let finalSummonerLevel = 0; 
        
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

        // --- Paso 2: Obtener datos del invocador y Partidas (LLAMADA REAL) ---
        try {
            const data = await getSummonerDataFromRiot(gn, tag, currentVersion);
            finalIconId = data.profileIconId;
            finalSummonerLevel = data.summonerLevel; 

            // Éxito: Actualizar el estado con todos los datos
            const url = `${DDRAGON_BASE_URL}${currentVersion}/img/profileicon/${finalIconId}.png`;
            
            setLocalState(prev => ({
                ...prev,
                iconId: finalIconId,
                iconUrl: url,
                loading: false,
                summonerLevel: finalSummonerLevel,
                // *** NUEVOS CAMBIOS CLAVE 5: Guardar el historial ***
                matchHistory: data.matchHistory,
                matchHistoryLoading: false,
                matchHistoryError: null,
            }));

        } catch (error) {
            const errorMessage = (error as Error).message;
            console.error("La llamada REAL a la API de Riot falló:", errorMessage);
            
            // Fallo: Mostrar error y usar datos por defecto/previos
            setLocalState(prev => ({ 
                ...prev, 
                error: `API FALLIDA: ${errorMessage}. Mostrando datos por defecto.`,
                loading: false,
                matchHistoryLoading: false,
                // *** NUEVOS CAMBIOS CLAVE 6: Mostrar error en el historial ***
                matchHistoryError: `No se pudo cargar el historial de partidas: ${errorMessage}`,
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

// Datos de ejemplo para el perfil
const DUMMY_PROFILE_STATS = {
    rank: 'DIAMANTE I',
    lp: 75,
    winRate: '58%',
    kda: '4.5',
    mainRole: 'MID',
    mainChampion: 'Zed',
    totalMatches: 210,
    lastUpdate: 'Hace 5 minutos',
    mockRankIcon: 'https://opgg-static.akamaized.net/images/medals/diamond_1.png?image=q_auto,f_webp,w_144,h_144&v=1719213892790'
};

interface PlayerProfilePageProps {
    gameName: string;
    tagLine: string;
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ gameName, tagLine, onNavigate }) => {
    const simulatedUrl = `/lol/profile/riot/${gameName}%23${tagLine}/overview`;
    
    // *** NUEVOS CAMBIOS CLAVE 7: Obtenemos el historial de partidas y sus estados ***
    const { 
        iconUrl, 
        loading, 
        iconId, 
        error, 
        summonerLevel, 
        matchHistory, 
        matchHistoryLoading, 
        matchHistoryError 
    } = useSummonerIcon(gameName, tagLine);
    
    const playerStats = DUMMY_PROFILE_STATS;

    const statCards = [
        { icon: TrendingUp, title: 'KDA Promedio', value: playerStats.kda, color: 'text-red-400' },
        { icon: BarChart3, title: 'Tasa de Victorias', value: playerStats.winRate, color: 'text-green-400' },
        { icon: LayoutGrid, title: 'Partidas Jugadas', value: playerStats.totalMatches, color: 'text-yellow-400' },
        { icon: Clock, title: 'Última Actualización', value: playerStats.lastUpdate, color: 'text-blue-400' },
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
                        <p className="text-lg text-gray-300 font-medium">Rol Principal: <span className="text-teal-400 font-semibold">{playerStats.mainRole}</span></p>
                        <p className="text-sm text-gray-500 mt-1">Campeón Más Jugado: {playerStats.mainChampion} (ID de Ícono: {iconId})</p>
                    </div>

                    {/* STATS DE RANKED */}
                    <div className="mt-6 md:mt-0 p-4 bg-gray-700 rounded-lg flex items-center shadow-inner">
                        <img src={playerStats.mockRankIcon} alt="Rango" className="w-16 h-16 mr-4"/>
                        <div className="text-right">
                            <p className="text-lg font-bold text-yellow-300">{playerStats.rank}</p>
                            <p className="text-2xl font-extrabold text-white">{playerStats.lp} LP</p>
                            <p className="text-sm text-gray-400">Tasa de Victorias: {playerStats.winRate}</p>
                        </div>
                    </div>
                </div>

                {/* CUERPO - Tarjetas de Estadísticas */}
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
                    {/* *** NUEVOS CAMBIOS CLAVE 8: Usar el nuevo componente MatchHistoryDisplay *** */}
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
                            onNavigate={onNavigate}
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
import React, { useState, useCallback } from 'react';
import RiotIdSearchBar from '../components/RiotIdSearchBar';
import PlayerStats from '../components/PlayerStats'; 
import RiotLoginButton from '../components/RiotLoginButton'; 
import axios from 'axios';
import Head from 'next/head';

// ----------------------------------------------------
// CONSTANTES Y UTILIDADES
// ----------------------------------------------------

const LOL_VERSION = '15.19.1'; // Versión actual de Data Dragon (ajustar si es necesario)

// Función para obtener la URL del icono de perfil
const getIconUrl = (iconId: number, version: string = LOL_VERSION): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
};

// ----------------------------------------------------
// INTERFACES
// ----------------------------------------------------

// Interfaz que coincide con los datos que devuelve /api/riot.ts
interface PlayerData {
    gameName: string;
    tagLine: string;
    profileIconId: number; 
    summonerLevel: number;
    puuid: string;
    platformId: string; // Región (ej: EUW1)
    summonerId: string;
    rank: string;
    masteryScore: number;
}

// Interfaz para el estado de la aplicación
interface AppState {
    data: PlayerData | null;
    loading: boolean;
    error: string | null;
}

// Interfaz para búsquedas recientes (Usando 'platformId')
interface RecentSearch {
    gameName: string;
    tagLine: string;
    platformId: string; 
    profileIconId: number;
}

// ----------------------------------------------------
// LÓGICA DE BÚSQUEDAS RECIENTES (Almacenamiento Local)
// ----------------------------------------------------

const saveRecentSearch = (newSearch: RecentSearch) => {
    try {
        const storageKey = 'elitegg_recent_searches';
        const searchesString = localStorage.getItem(storageKey);
        let searches: RecentSearch[] = searchesString ? JSON.parse(searchesString) : [];
        
        const uniqueKey = `${newSearch.gameName}#${newSearch.tagLine}`;
        
        // Eliminar duplicado si ya existe
        searches = searches.filter(search => 
            `${search.gameName}#${search.tagLine}` !== uniqueKey
        );
        
        searches.unshift(newSearch);
        searches = searches.slice(0, 5); // Mantener solo 5 búsquedas
        
        localStorage.setItem(storageKey, JSON.stringify(searches));

    } catch (e) {
        console.error("Error al acceder a localStorage:", e);
    }
};

// ----------------------------------------------------
// COMPONENTE HOME (PÁGINA PRINCIPAL)
// ----------------------------------------------------

const Home: React.FC = () => {
    const [state, setState] = useState<AppState>({
        data: null,
        loading: false,
        error: null,
    });

    // Función principal de búsqueda que llama al endpoint de la API
    const handleSearch = useCallback(async (riotId: string, tagLine: string) => {
        setState(prev => ({ ...prev, loading: true, error: null, data: null }));

        try {
            // Nota: Aquí se asume que tienes un backend que maneja la API de Riot Games
            const response = await axios.get('/api/riot', {
                params: {
                    gameName: riotId,
                    tagLine: tagLine,
                }
            });

            const playerData = response.data as PlayerData;

            // Guardar la búsqueda reciente (usando platformId)
            saveRecentSearch({
                gameName: playerData.gameName,
                tagLine: playerData.tagLine,
                platformId: playerData.platformId, 
                profileIconId: playerData.profileIconId,
            });

            setState({
                data: playerData,
                loading: false,
                error: null,
            });

        } catch (err) {
            let errorMessage = 'Un error desconocido ocurrió.';
            if (axios.isAxiosError(err) && err.response) {
                // Mensaje de error personalizado del backend o genérico
                errorMessage = err.response.data.error || `Error ${err.response.status}: Jugador no encontrado.`;
            }
            
            setState({
                data: null,
                loading: false,
                error: errorMessage,
            });
        }
    }, []);

    const iconUrl = state.data ? getIconUrl(state.data.profileIconId) : '';

    return (
        <>
            <Head>
                <title>EliteGG Riot Tracker</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8 font-sans">
                
                <header className="py-8 w-full max-w-4xl text-center">
                    <h1 className="text-5xl font-extrabold text-blue-500 tracking-tight">EliteGG Tracker 🎮</h1>
                    <p className="mt-2 text-xl text-gray-400">Busca cualquier Riot ID (NombreDeJuego#TAG) para ver estadísticas de League of Legends.</p>
                </header>

                <main className="w-full max-w-lg mb-12">
                    <RiotIdSearchBar onSearch={handleSearch} loading={state.loading} />
                </main>

                <div className="w-full max-w-lg mb-12">
                    <p className="text-center text-gray-500 mb-4 font-semibold text-sm">— OBTÉN TUS ESTADÍSTICAS PRIVADAS —</p>
                    <RiotLoginButton />
                </div>

                <section className="w-full max-w-4xl p-6 bg-gray-800 rounded-xl shadow-2xl">
                    
                    {state.error && (
                        <div className="bg-red-900 p-4 rounded-lg text-red-300 font-semibold border-l-4 border-red-500 mb-6">
                            <p className="font-bold mb-1">¡Error en la búsqueda!</p>
                            <p>{state.error}</p>
                        </div>
                    )}

                    {state.loading && (
                        <div className="flex justify-center items-center py-10 text-blue-400">
                            <span className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mr-3"></span>
                            Cargando datos...
                        </div>
                    )}

                    {/* Mostrar PlayerStats solo si state.data existe y no está cargando */}
                    {state.data && !state.loading && (
                        <PlayerStats 
                            playerData={state.data!} // El operador '!' confirma que no es null
                            iconUrl={iconUrl}
                            version={LOL_VERSION}
                        />
                    )}
                    
                    {!state.data && !state.loading && !state.error && (
                        <div className="p-10 text-center text-gray-500 bg-gray-700/50 rounded-lg">
                            <p className="text-lg">Inicia tu búsqueda o conéctate con Riot Games para empezar.</p>
                        </div>
                    )}
                </section>
                
                <footer className="mt-12 text-gray-600 text-sm">
                    <p>Datos proporcionados por la API de Riot Games. Versión LoL: {LOL_VERSION}</p>
                </footer>
            </div>
        </>
    );
};

export default Home;
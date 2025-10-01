import React, { useState, useCallback } from 'react';
import RiotIdSearchBar from '../components/RiotIdSearchBar';
import axios from 'axios';
import Head from 'next/head';

// Interfaz para los datos del jugador (Simplificado)
interface PlayerData {
    name: string;
    profileIconId: number;
    summonerLevel: number;
    puuid: string;
    region: string;
    ranks: any[]; // Aquí irían los datos de rank (Solo/Duo, Flex)
}

// Interfaz para el estado de la aplicación
interface AppState {
    data: PlayerData | null;
    loading: boolean;
    error: string | null;
}

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
            // Llama a la función API en el servidor de Vercel: /api/riot/player-data
            const response = await axios.get('/api/riot/player-data', {
                params: {
                    riotId,
                    tagLine,
                    // Se asume la región euw1 por defecto para el ejemplo
                    regionLoL: 'euw1', 
                }
            });

            // Si es exitoso, actualiza los datos
            setState({
                data: response.data as PlayerData,
                loading: false,
                error: null,
            });

        } catch (err) {
            let errorMessage = 'Un error desconocido ocurrió.';
            if (axios.isAxiosError(err) && err.response) {
                // Capturamos el error enviado por el backend
                errorMessage = err.response.data.error || errorMessage;
            }
            
            setState({
                data: null,
                loading: false,
                error: errorMessage,
            });
        }
    }, []);

    // Helper para mostrar la clasificación
    const renderRanks = (ranks: any[]) => {
        if (!ranks || ranks.length === 0) {
            return <p className="text-gray-400 mt-2">Sin datos de clasificación en Solo/Duo o Flex.</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {ranks.map((rank, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                        <p className="font-bold text-lg text-white">{rank.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex'}</p>
                        <p className="text-xl font-extrabold text-blue-400">{rank.tier} {rank.rank}</p>
                        <p className="text-sm text-gray-400">{rank.leaguePoints} LP | {rank.wins}V / {rank.losses}D</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>EliteGG Riot Tracker</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
                <header className="py-8 w-full max-w-4xl text-center">
                    <h1 className="text-4xl font-extrabold text-blue-500">EliteGG Tracker 🎮</h1>
                    <p className="mt-2 text-gray-400">Busca cualquier Riot ID (NombreDeJuego#TAG) para ver estadísticas de League of Legends.</p>
                </header>

                <main className="w-full max-w-lg mb-12">
                    {/* Componente de la barra de búsqueda */}
                    <RiotIdSearchBar onSearch={handleSearch} loading={state.loading} />
                </main>

                <section className="w-full max-w-4xl p-6 bg-gray-800 rounded-xl shadow-2xl">
                    {state.loading && (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                            <p className="text-blue-400">Buscando invocador...</p>
                        </div>
                    )}

                    {state.error && (
                        <div className="bg-red-900 p-4 rounded-lg text-red-300 font-semibold border-l-4 border-red-500">
                            <p className="font-bold mb-1">¡Error en la búsqueda!</p>
                            <p>{state.error}</p>
                        </div>
                    )}

                    {state.data && (
                        <div className="bg-gray-700 p-6 rounded-xl">
                            <div className="flex items-center border-b border-gray-600 pb-4 mb-4">
                                <span className="inline-block bg-gray-600 p-3 rounded-full text-blue-400 text-2xl">
                                    👤
                                </span>
                                <div className="ml-4">
                                    <h2 className="text-3xl font-bold text-white">{state.data.name}</h2>
                                    <p className="text-blue-400 text-lg">Nivel {state.data.summonerLevel} | Región: {state.data.region}</p>
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-semibold mt-6 mb-2 text-white">Clasificación (Ranks)</h3>
                            {renderRanks(state.data.ranks)}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default Home;

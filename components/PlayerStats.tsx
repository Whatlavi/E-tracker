import React, { useState, useEffect } from 'react';

// ----------------------------------------------------
// 1. Tipos de Datos (Interfaces)
// ----------------------------------------------------

interface PlayerData {
    puuid: string;
    summonerId: string;
    summonerLevel: number;      
    profileIconId: number;     
    regionPlataforma: string;  
    gameName: string;          
    tagLine: string;           
}

interface PlayerStatsProps {
    playerData: PlayerData | null;
    isLoading: boolean;
}

const RanksDisplay: React.FC = () => {
    return (
        <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
            <h3 className="text-xl font-semibold text-white mb-2">Clasificación (Ranks)</h3>
            <p className="text-gray-400">Sin datos de clasificación en Solo/Duo o Flex.</p>
        </div>
    );
};


// ----------------------------------------------------
// 2. Componente Principal PlayerStats
// ----------------------------------------------------

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerData, isLoading }) => {
    
    // 🚨 IMPLEMENTACIÓN DINÁMICA: Estado para guardar la versión de LOL
    const [lolVersion, setLolVersion] = useState<string | null>(null);

    // OBTENER LA VERSIÓN MÁS RECIENTE AL MONTAR EL COMPONENTE
    useEffect(() => {
        const fetchLolVersion = async () => {
            try {
                // Llama al endpoint de DDragon para obtener todas las versiones
                const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
                if (response.ok) {
                    const versions = await response.json();
                    // El primer elemento es la versión más reciente
                    setLolVersion(versions[0]);
                } else {
                    // Fallback a una versión conocida si la API falla
                    setLolVersion('14.24.1'); 
                }
            } catch (error) {
                console.error("Error al obtener la versión de LoL:", error);
                setLolVersion('14.24.1'); // Versión de fallback
            }
        };

        if (!lolVersion) {
            fetchLolVersion();
        }
    }, [lolVersion]);
    
    // --- Lógica de Carga y Estado Vacío ---

    // El componente espera a que tanto los datos del jugador como la versión de LOL se carguen
    if (isLoading || !lolVersion) { 
        return <div className="text-center text-white p-10">Cargando datos y recursos...</div>;
    }

    if (!playerData) {
        // Muestra la interfaz inicial vacía
        return (
            <div className="player-stats-container max-w-xl mx-auto p-4 bg-gray-900 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-white mb-4">EliteGG Tracker 🎮</h1>
                <p className="text-gray-400 mb-6">
                    Busca cualquier Riot ID (NombreDeJuego#TAG) para ver estadísticas de League of Legends.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-6 border-t border-gray-700 pt-4">
                    <span className="font-bold text-white">👤</span>
                    <span className="text-gray-400">Nivel | Región:</span>
                </div>
                <RanksDisplay />
            </div>
        );
    }
    
    // --- Lógica de Renderizado con Datos ---

    const { gameName, tagLine, summonerLevel, profileIconId, regionPlataforma } = playerData;
    
    // URL generada con la versión de LOL dinámica
    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${lolVersion}/img/profileicon/${profileIconId}.png`;
    
    return (
        <div className="player-stats-container max-w-xl mx-auto p-4 bg-gray-900 rounded-xl shadow-lg">
            
            <h1 className="text-3xl font-bold text-white mb-4">EliteGG Tracker 🎮</h1>
            
            {/* Contenedor del Icono y el Riot ID */}
            <div className="flex items-center space-x-4 mb-4 border-b border-gray-700 pb-4">
                
                {/* IMAGEN DEL PERFIL */}
                <div className="relative">
                    <img 
                        src={iconUrl} 
                        alt={`Icono de Invocador: ${gameName}`} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                        onError={(e) => { 
                             console.error(`Error al cargar el icono. URL fallida: ${iconUrl}`);
                        }}
                    />
                    {/* Nivel superpuesto en el icono */}
                    <span className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-gray-900">
                        {summonerLevel}
                    </span>
                </div>

                <div>
                    {/* RIOT ID BUSCADO */}
                    <div className="text-2xl font-extrabold text-blue-400">
                        {gameName}#{tagLine}
                    </div>

                    {/* REGIÓN debajo del nombre */}
                    <div className="text-sm text-gray-400 mt-1">
                        Región: {regionPlataforma.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE CLASIFICACIÓN */}
            <RanksDisplay />
            
        </div>
    );
};

export default PlayerStats;
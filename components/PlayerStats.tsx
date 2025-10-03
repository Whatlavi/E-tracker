import React from 'react';

// Define la estructura de datos que esperamos recibir (Consistente con pages/index.tsx)
interface PlayerData {
    gameName: string;
    tagLine: string;
    summonerLevel: number;
    profileIconId: number;
    puuid: string;
    platformId: string; // ✅ Propiedad correcta para la región
    summonerId: string;
    rank: string; 
    masteryScore: number;
}

interface PlayerStatsProps {
    playerData: PlayerData;
    iconUrl: string;
    version: string; // Versión de Data Dragon
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerData, iconUrl, version }) => {
    
    // Función de ayuda para obtener la URL del icono de rango (ejemplo)
    const getRankIconUrl = (rank: string) => {
        const tier = rank.split(' ')[0].toLowerCase(); // Ej: 'silver'
        if (tier === 'unranked') {
            return 'https://placehold.co/100x100/333333/ffffff?text=UNRANKED';
        }
        // Usando una URL de ejemplo
        // Nota: En una app real, esta URL provendría de tu propio CDN o Data Dragon
        return `https://opgg-static.akamaized.net/images/medals_new/${tier}_3.png`; 
    };

    return (
        <div className="p-6 md:p-10 bg-gray-900 rounded-2xl shadow-inner border border-blue-500/30">
            
            {/* Cabecera del Perfil */}
            <header className="flex flex-col md:flex-row items-center border-b border-gray-700 pb-6 mb-6">
                
                {/* Icono de Perfil y Nivel */}
                <div className="relative mb-4 md:mb-0 md:mr-6">
                    <img 
                        src={iconUrl} 
                        alt={`Profile Icon ${playerData.profileIconId}`} 
                        className="w-24 h-24 rounded-xl border-4 border-blue-500 shadow-md object-cover"
                        // Fallback por si la URL del ícono falla
                        onError={(e) => e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/29.png`}
                    />
                    <span className="absolute bottom-[-10px] right-[-10px] bg-gray-700 text-xs font-bold px-3 py-1 rounded-full border-2 border-gray-900 shadow-lg">
                        Lv. {playerData.summonerLevel}
                    </span>
                </div>

                {/* Nombre y Región */}
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-extrabold text-blue-300">
                        {playerData.gameName}
                        <span className="text-gray-400 text-xl ml-2 font-normal">#{playerData.tagLine}</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        PUUID: {playerData.puuid.substring(0, 12)}... | Región: {playerData.platformId}
                    </p>
                    <p className="text-lg text-blue-500 font-semibold mt-2">
                        Puntuación de Maestría Total: <span className="text-yellow-400">{playerData.masteryScore}</span>
                    </p>
                </div>
            </header>

            {/* Estadísticas Clave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                
                {/* Columna de Rankeada (Solo/Duo) */}
                <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                        <span className="text-xl mr-2">⚔️</span> Clasificatoria Solo/Duo
                    </h3>
                    <div className="flex items-center space-x-4">
                        <img 
                            src={getRankIconUrl(playerData.rank)} 
                            alt={playerData.rank} 
                            className="w-20 h-20"
                            onError={(e) => e.currentTarget.src = 'https://placehold.co/80x80/000/fff?text=RANK'}
                        />
                        <div>
                            <p className="text-gray-400 text-sm">Rango Actual</p>
                            <p className="text-3xl font-black" style={{ color: playerData.rank === 'Unranked' ? '#aaa' : '#00bfa5' }}>
                                {playerData.rank}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Simulado / League-V4 Pendiente</p>
                        </div>
                    </div>
                </div>

                {/* Columna de Maestría y Partidas */}
                <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                        <span className="text-xl mr-2">🌟</span> Maestría
                    </h3>
                    <p className="text-gray-400">Las maestrías de tus campeones más jugados se mostrarán aquí. (Match-V5/Mastery-V4)</p>
                    <div className="mt-4">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md">
                            Ver Historial de Partidas
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default PlayerStats;
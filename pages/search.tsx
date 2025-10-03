import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios'; 

// 🚨 Versión de Data Dragon comprobada y funcional
const LOL_VERSION = '15.19.1';

interface PlayerData {
    name: string;
    tagLine: string;
    puuid: string;
    summonerId: string;
    ranks: any[]; 
    region: string; // El backend devuelve "euw1", por ejemplo
    summonerLevel: number; 
    // 🚨 CAMBIO CRÍTICO: Añadir el ID del icono
    profileIconId: number; 
}

const SearchPage = () => {
    const router = useRouter();
    
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Función de búsqueda (espera Nombre y TagLine separados)
    const fetchPlayerData = async (gameName: string, tagLine: string, regionLoL: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<PlayerData>(
                `/api/riot/player-data?riotId=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&regionLoL=${regionLoL}`
            );
            setPlayerData(res.data);
        } catch (err) { 
            if (axios.isAxiosError(err) && err.response) {
                const apiErrorMessage = (err.response.data as {error?: string}).error;
                setError(apiErrorMessage || `Error ${err.response.status} de la API.`);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error desconocido al buscar datos.');
            }
            
            setPlayerData(null);
        } finally {
            setLoading(false);
        }
    };

    // Lógica de carga de datos que se ejecuta solo cuando el router está listo
    useEffect(() => {
        if (!router.isReady) {
            return; 
        }
        
        const { riotId: fullRiotIdQuery, regionLoL } = router.query; 
        const defaultRegion = (regionLoL as string) || 'euw1';

        if (typeof fullRiotIdQuery === 'string' && fullRiotIdQuery.trim() !== '') {
            
            // LÓGICA CRÍTICA: Dividir el Riot ID completo del query string
            const parts = fullRiotIdQuery.split('#');

            if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
                const gameName = parts[0].trim();
                const tagLine = parts[1].trim();

                fetchPlayerData(gameName, tagLine, defaultRegion);
            } else {
                setError("Formato de Riot ID incorrecto. Debe ser NombreDeJuego#TAG.");
                setLoading(false);
            }
        } else {
            setLoading(false);
            setPlayerData(null);
        }
        
    }, [router.isReady, router.query]); 
    
    // --- Funciones de Renderizado ---
    
    const renderRank = (rankEntry: any, title: string) => {
        if (!rankEntry) {
            return <p>{title}: **Sin Clasificar** (Unranked)</p>;
        }
        return (
            <p style={{ margin: '5px 0' }}>
                {title}: **{rankEntry.tier} {rankEntry.rank}** ({rankEntry.leaguePoints} LP) - W:{rankEntry.wins} / L:{rankEntry.losses}
            </p>
        );
    };

    // --- Renderizado de la Interfaz ---
    if (!router.isReady) {
        return <div style={{ padding: '20px' }}>Cargando aplicación...</div>; 
    }
    
    if (loading) {
        return <div style={{ padding: '20px' }}>Buscando al invocador...</div>;
    }
    
    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error al buscar: {error}</div>;
    }
    
    if (!playerData) {
        return <div style={{ padding: '20px' }}>Introduce un Riot ID y Tagline para empezar la búsqueda.</div>;
    }

    // 🚨 CONSTRUCCIÓN DE LA URL DE LA IMAGEN
    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${LOL_VERSION}/img/profileicon/${playerData.profileIconId}.png`;

    const soloDuoRank = playerData.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5');
    const flexRank = playerData.ranks.find(r => r.queueType === 'RANKED_FLEX_SR');

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px' }}>
            
            {/* 🚨 ÁREA DE PERFIL Y FOTO */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <div style={{ position: 'relative' }}>
                    <img 
                        src={iconUrl} 
                        alt={`Icono de perfil de ${playerData.name}`} 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #007bff', objectFit: 'cover' }} 
                        onError={(e) => {
                            console.error("Error al cargar la imagen. URL:", iconUrl);
                            // Opcional: e.currentTarget.src = '/ruta/a/imagen/default.png';
                        }}
                    />
                    {/* Nivel superpuesto */}
                    <span style={{ 
                        position: 'absolute', 
                        bottom: '-5px', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        backgroundColor: '#333', 
                        color: 'white', 
                        fontSize: '12px', 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        border: '1px solid white'
                    }}>
                        {playerData.summonerLevel}
                    </span>
                </div>
                
                <div style={{ marginLeft: '15px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#007bff' }}>{playerData.name}#{playerData.tagLine}</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#555' }}>Región: **{playerData.region.toUpperCase()}**</p>
                </div>
            </div>
            
            <h3>Clasificación</h3>
            {renderRank(soloDuoRank, 'Solo/Duo')}
            {renderRank(flexRank, 'Flex')}
            
            <p style={{ marginTop: '20px', fontSize: '10px', color: '#888' }}>PUUID: {playerData.puuid}</p>
        </div>
    );
};

export default SearchPage;
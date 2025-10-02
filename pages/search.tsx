// pages/search.tsx - VERSIÓN FINAL Y COMPLETA (Next.js Frontend)

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios'; 

interface PlayerData {
    name: string;
    tagLine: string;
    puuid: string;
    summonerId: string;
    ranks: any[]; 
    region: string;
    summonerLevel: number; 
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
            // 🛑 LLAMADA CORREGIDA: Usamos riotId y tagLine como parámetros separados
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
            
            // 🛑 LÓGICA CRÍTICA: Dividir el Riot ID completo del query string
            const parts = fullRiotIdQuery.split('#');

            if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
                const gameName = parts[0].trim();
                const tagLine = parts[1].trim();

                fetchPlayerData(gameName, tagLine, defaultRegion);
            } else {
                // Muestra un error si el formato del Riot ID no es Nombre#TAG
                setError("Formato de Riot ID incorrecto. Debe ser NombreDeJuego#TAG.");
                setLoading(false);
            }
        } else {
            setLoading(false);
            setPlayerData(null);
        }
        
    }, [router.isReady, router.query]); 
    
    // --- Renderizado de la Interfaz ---
    if (!router.isReady) {
        return <div>Cargando aplicación...</div>; 
    }
    
    if (loading) {
        return <div>Buscando al invocador...</div>;
    }
    
    if (error) {
        return <div>Error al buscar: {error}</div>;
    }
    
    if (!playerData) {
        // Esto solo debería aparecer si no hay query params en la URL
        return <div>Introduce un Riot ID y Tagline para empezar la búsqueda.</div>;
    }

    // Encuentra los datos de Solo/Duo y Flex
    const soloDuoRank = playerData.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5');
    const flexRank = playerData.ranks.find(r => r.queueType === 'RANKED_FLEX_SR');

    const renderRank = (rankEntry: any, title: string) => {
        if (!rankEntry) {
            return <p>{title}: **Sin Clasificar** (Unranked)</p>;
        }
        return (
            <p>
                {title}: **{rankEntry.tier} {rankEntry.rank}** ({rankEntry.leaguePoints} LP) - W:{rankEntry.wins} / L:{rankEntry.losses}
            </p>
        );
    };

    return (
        <div>
            <h1>Resultados para {playerData.name}#{playerData.tagLine}</h1>
            
            <p>Región: **{playerData.region}** | Nivel de Invocador: **{playerData.summonerLevel}**</p>

            <h3>Clasificación</h3>
            {renderRank(soloDuoRank, 'Solo/Duo')}
            {renderRank(flexRank, 'Flex')}
            
            <p>PUUID: {playerData.puuid}</p>
        </div>
    );
};

export default SearchPage;
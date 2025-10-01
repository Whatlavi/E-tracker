"use client";
import React, { useState, useMemo, useCallback } from 'react';
// Se ha eliminado 'react-icons' y se usan Emojis para evitar errores de dependencia.

// Define la estructura de un jugador sugerido
interface SuggestedPlayer {
    gameName: string;
    tagLine: string;
}

// Datos de ejemplo para simular la lista de jugadores recientes
const DUMMY_PLAYERS: SuggestedPlayer[] = [
    { gameName: "YIKARMAIY", tagLine: "EUW" },
    { gameName: "ZEDientodettas", tagLine: "PORFA" },
    { gameName: "Sung Jin woo", tagLine: "SOUL" },
    { gameName: "Faker", tagLine: "KR1" },
    { gameName: "Caps", tagLine: "EUW" },
];

interface RiotIdSearchBarProps {
    onSearch: (riotId: string, tagLine: string) => void;
    loading: boolean;
}

const RiotIdSearchBar: React.FC<RiotIdSearchBarProps> = ({ onSearch, loading }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lógica para filtrar sugerencias basadas en el input
    const filteredPlayers = useMemo(() => {
        if (!inputValue) return DUMMY_PLAYERS;
        
        const lowerInput = inputValue.toLowerCase().replace('#', '');
        
        return DUMMY_PLAYERS.filter(p => 
            (p.gameName.toLowerCase() + p.tagLine.toLowerCase()).includes(lowerInput)
        );
    }, [inputValue]);
    
    // Función central para manejar la búsqueda, ya sea por input o sugerencia
    const handleSearch = useCallback((input: string) => {
        setError(null);
        const trimmedId = input.trim();
        const parts = trimmedId.split('#');

        if (parts.length !== 2) {
             return setError('Formato incorrecto. Usa NombreDeJuego#TAG');
        }

        const riotId = parts[0].trim();
        const tagLine = parts[1].trim();

        if (!riotId || !tagLine) {
            return setError('Nombre o Etiqueta vacíos.');
        }

        onSearch(riotId, tagLine);
        setShowSuggestions(false);
        setInputValue(`${riotId}#${tagLine}`);
    }, [onSearch]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading) {
            handleSearch(inputValue);
        }
    };
    
    // Función que se llama al hacer clic en una sugerencia
    const handleSuggestionClick = (player: SuggestedPlayer) => {
        handleSearch(`${player.gameName}#${player.tagLine}`);
    };

    return (
        <div className="relative w-full max-w-lg">
            {/* INPUT DE BÚSQUEDA */}
            <form onSubmit={handleFormSubmit} className="flex">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                        setError(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                    placeholder="Enter Riot ID, ie. player#NA1"
                    className="flex-grow p-3 border border-gray-600 rounded-l bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white py-3 px-6 rounded-r hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>

            {/* ERROR DE FORMATO */}
            {error && <p className="mt-2 text-red-500 font-semibold">{error}</p>}

            {/* MENÚ DESPLEGABLE DE SUGERENCIAS */}
            {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded shadow-2xl p-2 max-h-80 overflow-y-auto">
                    
                    {/* BARRA DE CATEGORÍAS (Emojis: 🕒 Recientes, ⭐ Favoritos) */}
                    <div className="flex text-sm border-b border-gray-700 mb-2">
                        <div className="py-2 px-3 text-blue-400 font-bold border-r border-gray-700 flex items-center">
                            <span className="mr-2 text-lg">🕒</span> RECIENTES
                        </div>
                        <div className="py-2 px-3 text-gray-400 flex items-center">
                            <span className="mr-2 text-lg">⭐</span> FAVORITOS
                        </div>
                    </div>
                    
                    {/* LISTA DE JUGADORES SUGERIDOS */}
                    {filteredPlayers.length > 0 ? (
                        <div className="space-y-1">
                            {filteredPlayers.map((player, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSuggestionClick(player)}
                                    className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-800 transition"
                                >
                                    {/* Icono de Riot ID reemplazado por Emoji de Videojuego (🎮) */}
                                    <span className="text-blue-500 mr-3 text-2xl">🎮</span>
                                    <div className="text-left">
                                        <span className="font-semibold text-white">{player.gameName}</span>
                                        <span className="text-gray-400 text-sm ml-2">#{player.tagLine}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 p-3">No hay coincidencias.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default RiotIdSearchBar;

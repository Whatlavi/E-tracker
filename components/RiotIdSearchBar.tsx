import React, { useState, useCallback, useEffect } from 'react';

interface RiotIdSearchBarProps {
    onSearch: (gameName: string, tagLine: string) => void;
    loading: boolean;
}

interface RecentSearch {
    gameName: string;
    tagLine: string;
    platformId: string;
    profileIconId: number;
}

const RiotIdSearchBar: React.FC<RiotIdSearchBarProps> = ({ onSearch, loading }) => {
    const [input, setInput] = useState('');
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        try {
            const searchesString = localStorage.getItem('elitegg_recent_searches');
            if (searchesString) {
                setRecentSearches(JSON.parse(searchesString));
            }
        } catch (e) {
            console.error("No se pudieron cargar las búsquedas recientes:", e);
        }
    }, [loading]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        
        const parts = input.trim().split('#');
        if (parts.length < 2 || parts[0].length === 0 || parts[1].length === 0) {
            console.error('Formato de Riot ID incorrecto: NombreDeJuego#TAG');
            return;
        }

        const gameName = parts[0].trim();
        const tagLine = parts[1].trim();

        if (gameName && tagLine) {
            onSearch(gameName, tagLine);
            setIsFocused(false); 
        }
    }, [input, onSearch]);

    const handleRecentClick = useCallback((search: RecentSearch) => {
        onSearch(search.gameName, search.tagLine);
        setInput(`${search.gameName}#${search.tagLine}`);
        setIsFocused(false);
    }, [onSearch]);

    return (
        <form onSubmit={handleSubmit} className="relative z-10">
            <div className="flex bg-gray-700 rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500/50 focus-within:border-blue-400 transition-all duration-300">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
                    placeholder="Buscar Riot ID: Nombre#TAG"
                    className="flex-grow p-4 text-white bg-gray-700 focus:outline-none placeholder-gray-400 text-lg"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className={`px-6 text-lg font-bold transition-colors duration-200 flex items-center justify-center ${
                        loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={loading}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Buscar'}
                </button>
            </div>

            {/* Desplegable de Búsquedas Recientes */}
            {isFocused && recentSearches.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                    <p className="px-4 py-2 text-sm font-semibold text-gray-400 border-b border-gray-700">Recientes</p>
                    {recentSearches.map((search, index) => (
                        <div 
                            key={index}
                            className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                            onMouseDown={() => handleRecentClick(search)} 
                        >
                            <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/15.19.1/img/profileicon/${search.profileIconId}.png`}
                                alt="Icon"
                                className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                                <p className="font-semibold">{search.gameName}#{search.tagLine}</p>
                                <p className="text-xs text-gray-500">{search.platformId}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </form>
    );
};

export default RiotIdSearchBar;
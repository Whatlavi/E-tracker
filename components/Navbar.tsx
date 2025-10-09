import React, { useState, useMemo, useCallback } from 'react';
// Importamos los íconos
import { Zap, Trophy, Swords, User, BookOpen, ScrollText, Shield, LayoutGrid, BarChart3, Clock, TrendingUp } from 'lucide-react';

// =================================================================
// SIMULACIÓN DE DATOS Y CONTEXTO
// =================================================================

// Versión de la CDN utilizada en los ejemplos del usuario
const CDN_VERSION = "15.20.1";
// URL base del CDN de Riot Games para íconos de perfil
const PROFILE_ICON_BASE_URL = `https://trackercdn.com/ddragon/cdn/${CDN_VERSION}/img/profileicon/`;

// Función para construir la URL del ícono dinámicamente
const getProfileIconUrl = (iconId: number): string => {
    // Usamos el formato de URL base + IconID + .png
    // NOTA: En una aplicación real, se usaría un proxy como tracker.gg para caché y optimización.
    return `${PROFILE_ICON_BASE_URL}${iconId}.png`;
};

// Datos de ejemplo para el perfil (simulación de respuesta de API)
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

// =================================================================
// COMPONENTE: PLAYER PROFILE PAGE
// =================================================================

interface PlayerProfilePageProps {
    gameName: string;
    tagLine: string;
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ gameName, tagLine, onNavigate }) => {
    // Simula que la URL se ha actualizado
    const simulatedUrl = `/lol/profile/riot/${gameName}%23${tagLine}/overview`;
    
    // Simulación de los datos específicos del jugador
    const playerStats = useMemo(() => {
        // En una app real, aquí se llamaría a la API para obtener el IconID real.
        let iconId: number = 6621; // Icono por defecto (ejemplo YIKARMAIY)

        // LÓGICA SIMULADA: Cambiar el ícono según el nombre buscado para demostrar la funcionalidad
        const lowerCaseGameName = gameName.toLowerCase();
        
        if (lowerCaseGameName.includes('zediento')) {
            iconId = 932; // Icono ejemplo ZEDientodettas
        } else if (lowerCaseGameName.includes('test')) {
            iconId = 3189; // Otro ícono de ejemplo popular
        }
        
        return {
            ...DUMMY_PROFILE_STATS,
            // Construye la URL del ícono dinámicamente
            profileIconUrl: getProfileIconUrl(iconId),
        };
    }, [gameName, tagLine]);

    const statCards = [
        { icon: TrendingUp, title: 'KDA Promedio', value: playerStats.kda, color: 'text-red-400' },
        { icon: BarChart3, title: 'Tasa de Victorias', value: playerStats.winRate, color: 'text-green-400' },
        { icon: LayoutGrid, title: 'Partidas Jugadas', value: playerStats.totalMatches, color: 'text-yellow-400' },
        { icon: Clock, title: 'Última Actualización', value: playerStats.lastUpdate, color: 'text-blue-400' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 pt-20 pb-10 text-white font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* SIMULACIÓN DE LA RUTA */}
                <p className="text-gray-500 text-xs mb-4">
                    Ruta simulada: <span className="font-mono bg-gray-800 p-1 rounded text-teal-400">{simulatedUrl}</span>
                </p>

                {/* HEADER DEL PERFIL */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row items-center border-t-4 border-teal-500">
                    
                    {/* Icono de Perfil y Campeón Principal */}
                    <div className="relative mb-4 md:mb-0 md:mr-6">
                        <img 
                            // URL del ícono generada dinámicamente
                            src={playerStats.profileIconUrl} 
                            alt="Icono de Perfil del Jugador" 
                            className="w-24 h-24 rounded-full border-4 border-gray-600 object-cover"
                            // Fallback en caso de que la imagen no cargue (aunque el CDN de Riot es fiable)
                            onError={(e) => { (e.target as HTMLImageElement).src = getProfileIconUrl(6621); }} 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-teal-500 p-1 rounded-full border-2 border-gray-800 shadow-lg">
                            <User className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Información Principal */}
                    <div className="text-center md:text-left flex-grow">
                        <h1 className="text-4xl font-extrabold mb-1">
                            {gameName}
                            <span className="text-gray-400 text-xl font-normal ml-2">#{tagLine}</span>
                        </h1>
                        <p className="text-lg text-gray-300 font-medium">Rol Principal: <span className="text-teal-400 font-semibold">{playerStats.mainRole}</span></p>
                        <p className="text-sm text-gray-500 mt-1">Campeón Más Jugado: {playerStats.mainChampion}</p>
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

                {/* SECCIÓN DE PARTIDAS (Mock) */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-teal-400 border-b border-gray-700 pb-2 mb-4">Historial de Partidas Recientes (Mock)</h2>
                    <div className="bg-gray-800 rounded-xl shadow-xl p-4 space-y-3">
                        {/* Ejemplo de partida - Usando 15.20.1 */}
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition cursor-pointer">
                            <div className="flex items-center">
                                <span className="text-sm font-bold text-green-400 w-16">VICTORIA</span>
                                <span className="mx-4 text-gray-400">|</span>
                                <img src="https://ddragon.leagueoflegends.com/cdn/15.20.1/img/champion/Zed.png" alt="Champ" className="w-10 h-10 rounded-md mr-4"/>
                                <div>
                                    <p className="font-semibold">Zed - Ranked Solo</p>
                                    <p className="text-xs text-gray-400">12/3/8 KDA | 25 min</p>
                                </div>
                            </div>
                            <button className="text-sm text-teal-400 hover:text-teal-300">Ver Detalles</button>
                        </div>
                          {/* Ejemplo de partida - Usando 15.20.1 */}
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition cursor-pointer">
                            <div className="flex items-center">
                                <span className="text-sm font-bold text-red-400 w-16">DERROTA</span>
                                <span className="mx-4 text-gray-400">|</span>
                                <img src="https://ddragon.leagueoflegends.com/cdn/15.20.1/img/champion/Irelia.png" alt="Champ" className="w-10 h-10 rounded-md mr-4"/>
                                <div>
                                    <p className="font-semibold">Irelia - Normal Draft</p>
                                    <p className="text-xs text-gray-400">5/10/4 KDA | 32 min</p>
                                </div>
                            </div>
                            <button className="text-sm text-teal-400 hover:text-teal-300">Ver Detalles</button>
                        </div>
                    </div>
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
// COMPONENTE: BARRA DE BÚSQUEDA FUNCIONAL (Simplificada sin "recientes")
// =================================================================

interface FunctionalSearchBarProps {
    onSearch: (gameName: string, tagLine: string) => void;
    loading: boolean;
}

const FunctionalSearchBar: React.FC<FunctionalSearchBarProps> = ({ onSearch, loading }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Función central para manejar la búsqueda
    const handleSearchExecution = useCallback((input: string) => {
        setError(null);
        const trimmedId = input.trim();
        const parts = trimmedId.split('#');

        // Se valida el formato Riot ID#TAG
        if (parts.length !== 2) {
             return setError('Formato incorrecto. Usa NombreDeJuego#TAG');
        }

        const gameName = parts[0].trim();
        const tagLine = parts[1].trim();

        if (!gameName || !tagLine) {
            return setError('Nombre o Etiqueta vacíos.');
        }

        onSearch(gameName, tagLine); // Ejecuta la función provista por el App
        setInputValue(`${gameName}#${tagLine}`);
    }, [onSearch]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading) {
            handleSearchExecution(inputValue);
        }
    };
    
    // Ya no hay sugerencias, solo el input
    return (
        <div className="relative w-64">
            {/* INPUT DE BÚSQUEDA */}
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
                {/* Ícono Zap dentro del campo de búsqueda */}
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            {/* MENSAJE DE ERROR */}
            {error && (
                   <div className="absolute z-50 w-full mt-1 bg-red-900 border border-red-700 rounded-lg shadow-2xl p-2 right-0">
                    <p className="text-red-300 font-semibold text-xs">{error}</p>
                </div>
            )}
        </div>
    );
};


// =================================================================
// COMPONENTE: NAVBAR PRINCIPAL
// =================================================================

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface NavbarProps {
    currentPath: string;
    onNavigate: (view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
    const navItems: NavItem[] = [
        { name: 'CAMPEONES', href: '/champions', icon: BookOpen },
        { name: 'NOTAS DEL PARCHE', href: '/patch-notes', icon: ScrollText },
        { name: 'RANKING', href: '/ranking', icon: Trophy },
        { name: 'E-SPORTS', href: '/esports', icon: Shield },
        { name: 'PvP', href: '/pvp', icon: Swords },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black shadow-xl border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo / Nombre de la App */}
                    <div className="flex-shrink-0">
                        <a 
                            href="#"
                            onClick={() => onNavigate('home')} 
                            className="text-2xl font-extrabold text-white tracking-wider hover:text-gray-300 transition duration-150"
                        >
                            Elitegg
                        </a>
                    </div>

                    {/* Elementos de Navegación */}
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => onNavigate(item.href)}
                                className={`text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center
                                    ${item.href === currentPath ? 'bg-gray-800 text-white' : ''}
                                `}
                                aria-current={item.href === currentPath ? 'page' : undefined}
                            >
                                <item.icon className="w-4 h-4 mr-1 text-teal-400" />
                                {item.name}
                            </button>
                        ))}
                    </div>
                    
                    {/* Barra de Búsqueda FUNCIONAL y Botón de Perfil */}
                    <div className="flex items-center space-x-4">
                        {/* Barra de Búsqueda Funcional (Visible solo en pantallas grandes) */}
                        <div className="hidden lg:block">
                            {/* La lógica de búsqueda real se inyecta desde App */}
                            <FunctionalSearchBar onSearch={(gn, tag) => onNavigate('profile', gn, tag)} loading={false} />
                        </div>

                        {/* Ícono de Perfil (Login) */}
                        <a 
                            href="#"
                            onClick={() => onNavigate('/login')}
                            className="text-gray-300 hover:bg-gray-800 hover:text-white p-2 rounded-full transition duration-150 shadow-md flex items-center"
                            aria-label="Iniciar sesión o ver perfil"
                        >
                            <User className="w-6 h-6 text-teal-400" />
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
};

// =================================================================
// COMPONENTE PRINCIPAL: APP
// =================================================================

interface PlayerData {
    gameName: string;
    tagLine: string;
}

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="min-h-screen bg-gray-900 pt-20 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold text-teal-400 mb-4">{title}</h1>
        <p className="text-gray-400">Esta es una página de ejemplo. Usa la barra de búsqueda para ver un perfil de jugador!</p>
    </div>
);


const App: React.FC = () => {
    // Estado para simular la navegación
    const [currentView, setCurrentView] = useState<'home' | 'profile' | string>('home');
    // Estado para guardar los datos del jugador activo
    const [activePlayer, setActivePlayer] = useState<PlayerData | null>(null);

    // Función de navegación centralizada
    const navigate = useCallback((view: 'home' | 'profile' | string, gameName?: string, tagLine?: string) => {
        if (view === 'profile' && gameName && tagLine) {
            setActivePlayer({ gameName, tagLine });
            setCurrentView('profile');
        } else if (view === 'home') {
            setActivePlayer(null);
            setCurrentView('home');
        } else {
             // Para otras rutas como /ranking, /champions, etc.
             setCurrentView(view);
             setActivePlayer(null);
        }
    }, []);

    // Renderizado condicional del contenido principal
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
                // Si el estado está desincronizado (vista 'profile' pero sin jugador), 
                // forzamos la navegación a 'home' y retornamos null en este ciclo de renderizado.
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
                             {/* Muestra la barra de búsqueda en móvil/tablet si no está en la navbar */}
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
            <Navbar currentPath={currentView} onNavigate={navigate} />
            <main>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;

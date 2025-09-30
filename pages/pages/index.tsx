import React, { useState } from "react";
import PlayerStats from "../components/PlayerStats";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLogin = () => {
    // Lógica para iniciar sesión con Riot
    setIsLoggedIn(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return; // validar input
    // Aquí podrías agregar más lógica si quieres
  };

  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">Elitegg</h1>
        <p className="text-lg">Tu tracker de estadísticas de League of Legends</p>
      </header>

      <section className="mb-8">
        {!isLoggedIn ? (
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Iniciar sesión con Riot
          </button>
        ) : (
          <form onSubmit={handleSearch} className="flex justify-center">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre del invocador"
              className="border p-2 rounded-l"
            />
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded-r"
            >
              Buscar
            </button>
          </form>
        )}
      </section>

      {/* Mostrar estadísticas si hay username */}
      {username && <PlayerStats username={username} />}
    </div>
  );
}

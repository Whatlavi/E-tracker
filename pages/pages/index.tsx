import { useState } from "react";
import PlayerStats from "../components/PlayerStats";

export default function Home() {
  const [username, setUsername] = useState("");

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">LoL Tracker 🎮</h1>
      
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nombre del invocador"
        className="mt-4 p-2 rounded text-black"
      />
      
      <PlayerStats username={username} />
    </main>
  );
}

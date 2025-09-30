"use client";
import { useState } from "react";
import PlayerStats from "./components/PlayerStats";

export default function Search() {
  const [name, setName] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        placeholder="Summoner Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <h1>Busca tu jugador</h1>
      {name && <PlayerStats username={name} />}
    </div>
  );
}

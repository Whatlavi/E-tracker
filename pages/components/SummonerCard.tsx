import React from "react";

// Interfaces
interface Summoner {
  name: string;
  summonerLevel: number;
  profileIconId?: number;
}

interface LeagueStat {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface Props {
  summoner: Summoner;
  stats?: LeagueStat[];
}

const SummonerCard: React.FC<Props> = ({ summoner, stats }) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded shadow-md w-full max-w-md">
      <h2 className="text-xl font-bold">{summoner.name}</h2>
      <p>Nivel: {summoner.summonerLevel}</p>
      {summoner.profileIconId && (
        <img
          src={`http://ddragon.leagueoflegends.com/cdn/13.19.1/img/profileicon/${summoner.profileIconId}.png`}
          alt="Profile Icon"
          className="w-16 h-16 rounded mt-2"
        />
      )}

      {stats && stats.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Ranked</h3>
          {stats.map((stat: LeagueStat) => (
            <div key={stat.queueType} className="mb-1">
              <strong>{stat.queueType}:</strong> {stat.tier} {stat.rank} ({stat.leaguePoints} LP) - {stat.wins}W/{stat.losses}L
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2">Sin estadísticas disponibles</p>
      )}
    </div>
  );
};

export default SummonerCard;

try {
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  if (!RIOT_API_KEY) throw new Error("Riot API key no configurada");

  const summonerRes = await fetch(
    `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
      summonerName
    )}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY } }
  );

  if (!summonerRes.ok) return res.status(summonerRes.status).json({ error: "Jugador no encontrado" });

  const summonerData: SummonerData = await summonerRes.json();

  const statsRes = await fetch(
    `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY } }
  );

  const statsData: LeagueStat[] = statsRes.ok ? (await statsRes.json() as LeagueStat[]) : [];

  res.status(200).json({ summoner: summonerData, stats: statsData });

} catch (err) {
  let message = "Error desconocido";
  if (err instanceof Error) message = err.message;
  res.status(500).json({ error: message });
}

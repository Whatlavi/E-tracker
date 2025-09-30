import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.RIOT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  if (!clientId || !process.env.NEXT_PUBLIC_BASE_URL) {
    return res.status(500).json({ error: "Variables de entorno no configuradas" });
  }

  const loginUrl = `https://auth.riotgames.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid`;

  res.redirect(loginUrl);
}

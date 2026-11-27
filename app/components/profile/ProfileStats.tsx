import { connection } from "next/server";
import { getProfileStats } from "@/lib/stats";
import Dashboard from "./Dashboard";
import Leaderboard from "./Leaderboard";
import FriendsPanel from "./FriendsPanel";

export default async function ProfileStats({ userId }: { userId: string }) {
  await connection();
  const s = await getProfileStats(userId);
  if (!s) return null;

  return (
    <div className="mt-8 space-y-6">
      <Dashboard s={s} />
      <div className="grid gap-6 md:grid-cols-2">
        <Leaderboard rows={s.leaderboard} />
        <FriendsPanel
          friendCode={s.friendCode}
          incoming={s.incoming}
          friends={s.friends}
        />
      </div>
    </div>
  );
}

import { auth } from "@/auth";
import ProfileView from "../../components/profile/ProfileView";

export const instant = false;

export default async function ProfilePage() {
  const session = await auth();
  return <ProfileView user={session?.user ?? null} />;
}

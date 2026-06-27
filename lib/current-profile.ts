import { auth } from "@clerk/nextjs/server"
import { db } from "./db";

export const currentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    console.log("auth did not work");
    return null;
  }

  const profile = await db.profile.findUnique({
    where: {
      userId
    }
  });

  return profile;
}
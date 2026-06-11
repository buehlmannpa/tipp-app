import { cache } from "react";
import { prisma } from "./db";

// Avatar des Users – per React-Cache dedupliziert (1 Query pro Request)
export const getAvatar = cache(async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });
  return user?.avatar ?? null;
});

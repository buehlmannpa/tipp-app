import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const SESSION_COOKIE = "session";
const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-bitte-in-produktion-setzen"
  );

export type Session = { userId: string; username: string; isAdmin: boolean };

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("60d")
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<Session>(token, secret());
    return {
      userId: payload.userId,
      username: payload.username,
      isAdmin: payload.isAdmin,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  return user;
}

/**
 * Admin-Prüfung für API-Routen: Session UND Admin-Flag frisch aus der DB.
 * Ein manipuliertes/veraltetes Token reicht damit nicht – entzogene
 * Admin-Rechte greifen sofort. Gibt null zurück, wenn kein Admin.
 */
export async function getAdminUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user?.isAdmin ? user : null;
}

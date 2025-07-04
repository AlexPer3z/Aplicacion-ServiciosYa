import type { Query, QueryClient } from "@tanstack/react-query";
import { sessionQueryOptions } from "../queryOptions";
import type { Enums } from "../../types/database.types";

export function getUserFromClient(client: QueryClient) {
  const session = client.getQueryData(sessionQueryOptions.queryKey);
  if (!session || !session.user) {
    throw new Error("Ninguna sesión o usuario encontrado.");
  }

  return session.user;
}

export type Roles = Enums<"user_role">;
// helpers
export function isWorker(role: Roles): boolean {
  return role === "worker";
}
export function isUser(role: Roles): boolean {
  return role === "user";
}
export function isAdmin(role: Roles): boolean {
  return role === "admin";
}

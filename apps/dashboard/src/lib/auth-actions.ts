"use server";

import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const result = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (result.error) {
    return { error: result.error.message };
  }

  redirect("/projects");
}

export async function signUp(email: string, password: string, name?: string) {
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  if (result.error) {
    return { error: result.error.message };
  }

  redirect("/projects");
}

export async function signOut() {
  await auth.api.signOut({
    headers: {
      // This would be set by the client
    },
  });
  redirect("/login");
}


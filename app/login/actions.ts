'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// ✅ LOGIN
export async function login(formData: FormData) {
  try {
    const supabase = createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      redirect(`/error?message=${encodeURIComponent("Email and password are required")}`);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/error?message=${encodeURIComponent(error.message)}`);
    }

    const redirectTo = (formData.get("redirectTo") as string) || "/";
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

    revalidatePath("/", "layout");
    redirect(safeRedirect);

  } catch (err) {
    redirect(`/error?message=${encodeURIComponent("Something went wrong")}`);
  }
}

// ✅ SIGNUP
export async function signup(formData: FormData) {
  try {
    const supabase = createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!email || !password) {
      redirect(`/error?message=${encodeURIComponent("All fields are required")}`);
    }

    if (password.length < 8) {
      redirect(`/error?message=${encodeURIComponent("Password must be at least 8 characters long.")}`);
    }

    if (password !== confirmPassword) {
      redirect(`/error?message=${encodeURIComponent("Passwords do not match.")}`);
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      redirect(`/error?message=${encodeURIComponent(error.message)}`);
    }

    // ⚠️ Important: email confirmation case
    redirect(`/success?message=${encodeURIComponent("Check your email to confirm your account")}`);

  } catch (err) {
    redirect(`/error?message=${encodeURIComponent("Something went wrong")}`);
  }
}

// ✅ SIGNOUT
export async function signout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
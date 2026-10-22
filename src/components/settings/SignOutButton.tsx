"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/hooks/useToast";

export default function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      setBusy(false);
      showToast("Couldn't sign out. Try again.");
      return;
    }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleSignOut}
      className="h-11 w-full rounded-xl bg-surface text-[15px] font-semibold text-danger disabled:opacity-50"
    >
      Sign Out
    </button>
  );
}

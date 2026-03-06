import { useState } from "react";
import type { User } from "../types/tarot";

export function useUser() {
  // For now, manual flag. Later integrate with RevenueCat
  const [user, setUser] = useState<User>({
    isPremium: false,
  });

  const togglePremium = () => {
    setUser((prev) => ({ ...prev, isPremium: !prev.isPremium }));
  };

  return {
    user,
    isPremium: user.isPremium,
    togglePremium,
  };
}

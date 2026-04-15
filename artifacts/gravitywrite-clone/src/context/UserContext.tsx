import { createContext, useContext, useState, ReactNode } from "react";

export interface GrowthStep {
  step: number;
  phase: string;
  title: string;
  description: string;
  action: string;
  tools: { name: string; anchor: string; reason: string }[];
  timeline: string;
  metric: string;
  done?: boolean;
}

export interface GrowthPlan {
  greeting: string;
  businessSummary: string;
  steps: GrowthStep[];
  quickWin: string;
  warningSign: string;
}

export interface UserProfile {
  name: string;
  businessType: string;
  businessLabel: string;
  goal: string;
  onboardingComplete: boolean;
  growthPlan: GrowthPlan | null;
  createdAt: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  businessType: "",
  businessLabel: "",
  goal: "",
  onboardingComplete: false,
  growthPlan: null,
  createdAt: new Date().toISOString(),
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateStepDone: (step: number, done: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (b: boolean) => void;
  resetProfile: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function loadProfile(): UserProfile {
  try {
    const saved = localStorage.getItem("ms_user_v2");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PROFILE;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(loadProfile);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    const p = loadProfile();
    return !p.onboardingComplete;
  });

  function setProfile(p: UserProfile) {
    setProfileState(p);
    try { localStorage.setItem("ms_user_v2", JSON.stringify(p)); } catch {}
  }

  function updateStepDone(step: number, done: boolean) {
    if (!profile.growthPlan) return;
    const updated: UserProfile = {
      ...profile,
      growthPlan: {
        ...profile.growthPlan,
        steps: profile.growthPlan.steps.map(s => s.step === step ? { ...s, done } : s),
      },
    };
    setProfile(updated);
  }

  function resetProfile() {
    try { localStorage.removeItem("ms_user_v2"); } catch {}
    setProfileState(DEFAULT_PROFILE);
    setShowOnboarding(true);
  }

  return (
    <UserContext.Provider value={{ profile, setProfile, updateStepDone, showOnboarding, setShowOnboarding, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}

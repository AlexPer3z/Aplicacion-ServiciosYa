import type { AuthChangeEvent, Session, Subscription, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import { zustandStorage } from "../lib/storagev2";
import { useHomeEventsStore } from "./homeEventsStore";
import { useNotificationStore } from "./notificationStore";
// 1. Import Vexo
import { identifyDevice } from "vexo-analytics";

interface AuthState {
    session: Session | null;
    user: User | null;
    isAuth: boolean;
    isGuest: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    setSession: (session: Session | null) => void;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    cleanup: () => void;
}

let authSubscription: Subscription | null = null;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            session: null,
            user: null,
            isAuth: false,
            isGuest: false,
            isLoading: true,
            isInitialized: false,

            setSession: (session) => {
                const user = session?.user ?? null;
                const isGuest = user?.user_metadata?.email === "guest@example.com";

                // 2. Identify with Email
                if (user?.email) {
                    // If it's the shared guest account, you might want to keep them anonymous
                    // so they don't all get merged into one user profile.
                    if (user.email === "guest@example.com") {
                        identifyDevice(null);
                    } else {
                        identifyDevice(user.email);
                    }
                } else {
                    identifyDevice(null);
                }

                set({
                    session,
                    user,
                    isAuth: !!session,
                    isGuest,
                    isLoading: false,
                });
            },

            initialize: async () => {
                if (get().isInitialized) {
                    return;
                }

                // Use cached session immediately if available
                const cachedSession = get().session;
                if (cachedSession?.user?.email) {
                    // 3. Identify from cache
                    if (cachedSession.user.email === "guest@example.com") {
                        identifyDevice(null);
                    } else {
                        identifyDevice(cachedSession.user.email);
                    }
                    set({ isInitialized: true, isLoading: false });
                }

                try {
                    const {
                        data: { session },
                        error,
                    } = await supabase.auth.getSession();

                    if (error) {
                        handleLogout();
                        identifyDevice(null); // Reset analytics
                        set({
                            session: null,
                            user: null,
                            isAuth: false,
                            isGuest: false,
                            isLoading: false,
                            isInitialized: true,
                        });
                        return;
                    }

                    const user = session?.user ?? null;
                    const isGuest = user?.user_metadata?.email === "guest@example.com";

                    // 4. Identify with fresh session
                    if (user?.email) {
                        if (user.email === "guest@example.com") {
                            identifyDevice(null);
                        } else {
                            identifyDevice(user.email);
                        }
                    } else {
                        identifyDevice(null);
                    }

                    set({
                        session,
                        user,
                        isAuth: !!session,
                        isGuest,
                        isLoading: false,
                        isInitialized: true,
                    });

                    // Setup auth listener
                    const {
                        data: { subscription },
                    } = supabase.auth.onAuthStateChange(
                        (_event: AuthChangeEvent, session: Session | null) => {
                            if (!session) {
                                handleLogout();
                            }

                            const user = session?.user ?? null;
                            const isGuest = user?.user_metadata?.email === "guest@example.com";

                            // 5. Update identification on auto-refresh or logout
                            if (user?.email) {
                                if (user.email === "guest@example.com") {
                                    identifyDevice(null);
                                } else {
                                    identifyDevice(user.email);
                                }
                            } else {
                                identifyDevice(null);
                            }

                            set({
                                session,
                                user,
                                isAuth: !!session,
                                isGuest,
                                isLoading: false,
                            });
                        }
                    );

                    authSubscription = subscription;
                } catch (error) {
                    identifyDevice(null);
                    set({
                        session: null,
                        user: null,
                        isAuth: false,
                        isGuest: false,
                        isLoading: false,
                        isInitialized: true,
                    });
                }
            },

            signOut: async () => {
                try {
                    set({ isLoading: true });
                    // 6. Reset identity before signing out
                    identifyDevice(null);

                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;

                    handleLogout();

                    set({
                        session: null,
                        user: null,
                        isAuth: false,
                        isGuest: false,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            cleanup: () => {
                if (authSubscription) {
                    authSubscription.unsubscribe();
                    authSubscription = null;
                }
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                session: state.session,
                user: state.user,
                isAuth: state.isAuth,
                isGuest: state.isGuest,
            }),
        }
    )
);

export const useIsAuth = () => useAuthStore((state) => state.isAuth);
export const useIsGuest = () => useAuthStore((state) => state.isGuest);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useSession = () => useAuthStore((state) => state.session);

export const useAuthUser = () => {
    const user = useAuthStore((state) => state.user);
    const isAuth = useIsAuth();

    if (!isAuth || !user) {
        throw new Error("useAuthenticatedUser must be used within authenticated context");
    }
    return user;
};

export const getUserID = () => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("User not found");
    return user.id;
};

const handleLogout = () => {
    useHomeEventsStore.getState().resetAllEvents();
    useNotificationStore.getState().resetUnread();
}
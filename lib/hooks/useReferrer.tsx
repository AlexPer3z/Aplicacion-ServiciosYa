import { useEffect, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthStackParamList } from "../../types/navigation";
import { supabase } from "../supabase";

const REFERRER_STORAGE_KEY = "pendingReferralCode";

interface UseReferrerOptions {
    capture?: boolean;
}

interface UseReferrerReturn {
    getReferrer: () => Promise<string | null>;
    clearReferrer: () => Promise<void>;
    setReferrer: (userId: string) => Promise<void>;
}

async function _setReferrer(userId: string, referred_by: string) {
    await supabase
        .from("usuarios")
        .update({
            referred_by
        })
        .eq("id", userId)
}

/**
 * Hook to manage referral codes from route parameters
 * @param options.capture - If true, automatically captures and stores the referrer from route params
 */
export function useReferrer(
    { capture = false }: UseReferrerOptions = {}
): UseReferrerReturn {
    const route = useRoute<RouteProp<AuthStackParamList, "Register">>();

    // Capture referrer from route params if enabled
    useEffect(() => {
        if (!capture) return;

        const referrer = route.params?.referralCode;

        if (referrer && typeof referrer === "string") {
            AsyncStorage.setItem(REFERRER_STORAGE_KEY, referrer).catch((error) => {
                console.error("Failed to store referral code:", error);
            });
        }
    }, [capture, route.params]);

    // Get stored referrer
    const getReferrer = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(REFERRER_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to retrieve referral code:", error);
            return null;
        }
    }, []);

    // Clear stored referrer
    const clearReferrer = useCallback(async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(REFERRER_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear referral code:", error);
        }
    }, []);

    const setReferrer = useCallback(async (userId: string) => {
        const code = await getReferrer();
        if (!code) return;
        try {
            await _setReferrer(userId, code);
            await clearReferrer();
            await supabase.rpc("award_referred_achievement", {
                referral_code_input: code,
            })
        } catch (error) {
            console.error("Failed to set referral code:", error);
        }
    }, [getReferrer, clearReferrer]);

    return {
        getReferrer,
        clearReferrer,
        setReferrer,
    };
}
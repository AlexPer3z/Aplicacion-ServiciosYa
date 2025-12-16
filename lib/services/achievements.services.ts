// services/achievements.service.ts
import { supabase } from '../supabase';
import { ACHIEVEMENTS, getUserProgress, type UserAchievement as AchievementWithStatus } from '../constants/achievements';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { perfilQueryOptions } from '../queryOptions';

// Query Keys Factory
export const achievementKeys = {
    all: ['achievements'] as const,
    lists: () => [...achievementKeys.all, 'list'] as const,
    list: (userId: string) => [...achievementKeys.lists(), userId] as const,
    progress: (userId: string) => [...achievementKeys.all, 'progress', userId] as const,
    detail: (userId: string, achievementKey: string) =>
        [...achievementKeys.all, 'detail', userId, achievementKey] as const,
};

/**
 * Get all achievements with user completion status
 */
export async function getUserAchievements(
    userId: string
): Promise<AchievementWithStatus[]> {
    const { data: userAchievements, error } = await supabase
        .from('user_achievements')
        .select('achievement_key, completed, completed_at')
        .eq('user_id', userId);

    if (error) throw error;
    if (!userAchievements?.length) return [];

    // Create lookup map for user achievements
    const userAchievementMap = new Map(
        userAchievements.map(ua => [ua.achievement_key, ua])
    );

    // Process achievements in a single pass
    const achievementsWithStatus: AchievementWithStatus[] = [];
    let foundNext = false;

    for (const achievement of ACHIEVEMENTS) {
        const userAchievement = userAchievementMap.get(achievement.key);

        // Only include achievements that have user records
        if (userAchievement) {
            const completed = userAchievement.completed || false;
            const achievementWithStatus: AchievementWithStatus = {
                ...achievement,
                completed,
                isNext: !foundNext && !completed,
            };
            if (!foundNext && !completed) {
                foundNext = true;
            }

            achievementsWithStatus.push(achievementWithStatus);
        }
    }

    return achievementsWithStatus;
}

const achievementsQueryOptions = (userId: string) => queryOptions({
    queryKey: achievementKeys.list(userId),
    queryFn: async () => await getUserAchievements(userId),
    placeholderData: () => [],
});

export function useAchievements() {
    const { data: userId } = useSuspenseQuery({ ...perfilQueryOptions, select: ({ id }) => id });
    const { data } = useSuspenseQuery(achievementsQueryOptions(userId));

    const completedCount = data.filter((achievement) => achievement.completed).length;
    const progress = getUserProgress(completedCount);

    return {
        items: data,
        progress
    };
}

export function useGrantAchievement() {
    const queryClient = useQueryClient();
    const { data: userId } = useSuspenseQuery({ ...perfilQueryOptions, select: ({ id }) => id });

    const invalidateAchievements = () => {
        queryClient.invalidateQueries({ queryKey: achievementKeys.list(userId) });
    };

    return {
        completeProfile: async () => {
            await grantAchievement.completeProfile(userId);
            invalidateAchievements();
        },
        checkService: async () => { await grantAchievement.checkService(); invalidateAchievements(); },
        refered: async (referral_code_input: string) => { await grantAchievement.refered(referral_code_input); invalidateAchievements(); },
    };
}

/**
 * Complete an achievement for a user
 */
export async function completeAchievement(
    userId: string,
    achievementKey: string
): Promise<void> {
    const { error } = await supabase.from('user_achievements').upsert(
        { user_id: userId, achievement_key: achievementKey, completed: true },
        { onConflict: 'user_id,achievement_key' }
    );

    if (error) throw error;
}

export async function first_service(userId: string) {
    const { count } = await supabase
        .from("servicios_contratados")
        .select("*", { count: "exact", head: true })
        .eq("contratado_id", userId);

    // if count is undefined or greater than 1
    if (!count || count > 1) {
        return;
    }

    const data = await supabase
        .from("user_achievements")
        .insert({
            user_id: userId,
            achievement_key: "first_service",
            completed: true,
        });

}

export const grantAchievement = {
    completeProfile: async (user_id: string) => {
        await supabase.from("user_achievements").insert({
            user_id,
            achievement_key: "profile_completed",
            completed: true,
        });
    },
    checkService: async () => await supabase.rpc("check_hirer_achievements"),
    refered: async (referral_code_input: string) => await supabase.rpc("award_referred_achievement", {
        referral_code_input,
    }),
}
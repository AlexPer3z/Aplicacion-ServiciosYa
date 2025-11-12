import type { MaterialIcons } from "@expo/vector-icons";

export interface Achievement {
    key: string;
    title: string;
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    sortOrder: number;
}

export interface UserAchievement extends Achievement {
    completed: boolean;
    isNext?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        key: 'profile_completed',
        title: 'Perfil Completo',
        description: 'Completá y verificá tu perfil para desbloquear todas las funciones.',
        icon: 'verified-user',
        sortOrder: 1,
    },
    {
        key: 'first_service',
        title: 'Primer Servicio Contratado',
        description: 'Contratá a tu primer profesional y empezá a resolver tus tareas.',
        icon: 'military-tech',
        sortOrder: 2,
    },
    {
        key: 'power_user',
        title: 'Usuario Activo',
        description: 'Completá 5 servicios exitosos.',
        icon: 'star',
        sortOrder: 3,
    },
    {
        key: 'refer_friend',
        title: 'Invitá y Ganá',
        description: 'Recomendá la app a un amigo.',
        icon: 'people',
        sortOrder: 4,
    },
];

// Helper para obtener un logro por clave
export const getAchievementByKey = (key: string): Achievement | undefined => {
    return ACHIEVEMENTS.find((achievement) => achievement.key === key);
};

// Helper para contar logros totales
export const getTotalAchievements = (): number => {
    return ACHIEVEMENTS.length;
};

export function getUserProgress(achievementsCount: number): number {
    const totalAchievements = getTotalAchievements();
    return totalAchievements > 0
        ? Math.round((achievementsCount / totalAchievements) * 100)
        : 0;
}

// components/ProviderInfoCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../lib/constants/colors';
import { useSuspenseQuery } from '@tanstack/react-query';
import { userServiceCountQueryOptions } from '../../lib/queryOptions';

interface ProviderInfoCardProps {
    user: string;
    providerName?: string;
    imageProfile?: string;
    onPress?: () => void;
}

export default function ProviderInfoCard({
    user,
    providerName = 'Proveedor verificado',
    imageProfile,
    onPress,
}: ProviderInfoCardProps) {
    const { data } = useSuspenseQuery(userServiceCountQueryOptions(user));
    
    return (
        <Pressable
            style={styles.providerCard}
            onPress={onPress}
            android_ripple={{ color: '#f3f4f6' }}
        >
            <View style={styles.providerInfo}>
                <View style={styles.providerAvatar}>
                    {imageProfile ? (
                        <Image
                            source={{ uri: imageProfile }}
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="person" size={20} color={colors.primary} />
                    )}
                </View>
                <View style={styles.providerDetails}>
                    <Text style={styles.providerName}>{providerName}</Text>
                    <View style={styles.providerRating}>
                        <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
                        <Text style={styles.providerRatingText}>{data} {data === 1 ? 'publicación' : 'publicaciones'}</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    providerCard: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    providerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f9ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    providerDetails: {
        flex: 1,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    providerRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    providerRatingText: {
        fontSize: 13,
        color: '#6b7280',
    },
});
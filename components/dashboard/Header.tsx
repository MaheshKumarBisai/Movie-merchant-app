import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useProfile } from '../../hooks/useProfile';
import { endpoints } from '../../config/api';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';

export const Header = () => {
    const { profile, loading } = useProfile();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);

    const bellAnim = useRef(new Animated.Value(0)).current;

    // Ring bell animation loop when unreadCount > 0
    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (unreadCount > 0) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(bellAnim, { toValue: -18, duration: 75, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: 18, duration: 75, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: -14, duration: 65, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: 14, duration: 65, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
                    Animated.timing(bellAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                    Animated.delay(1800), // Pause between ringing sequences
                ])
            );
            animation.start();
        } else {
            bellAnim.setValue(0);
        }

        return () => {
            if (animation) animation.stop();
        };
    }, [unreadCount]);

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, 8000); // Check every 8s for new booking notifications
            return () => clearInterval(interval);
        }, [])
    );

    const fetchUnreadCount = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;
            const response = await fetch(`${endpoints.notifications}/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const text = await response.text();
            if (!response.ok) {
                console.error(`Failed to fetch unread count (Status ${response.status}):`, text);
                return;
            }

            try {
                const data = JSON.parse(text);
                setUnreadCount(data.count || 0);
            } catch (parseError) {
                console.error("Failed to parse unread count JSON. Response was:", text);
            }
        } catch (error) {
            console.error("Network error fetching unread count:", error);
        }
    };

    const getAvatarUri = (url: string | null | undefined) => {
        if (!url) return 'https://ui-avatars.com/api/?name=M&background=1F1F2E&color=8A2BE2&size=200';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) {
            const baseUrl = endpoints.profile.split('/auth/me')[0];
            return `${baseUrl}${url}`;
        }
        return url;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const displayName = profile?.name || 'Merchant';

    const bellRotation = bellAnim.interpolate({
        inputRange: [-18, 0, 18],
        outputRange: ['-18deg', '0deg', '18deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <View style={styles.imageWrapper}>
                    {loading ? (
                        <View style={[styles.profileImage, styles.loaderContainer, { backgroundColor: colors.surface }]}>
                            <ActivityIndicator size="small" color="#8A2BE2" />
                        </View>
                    ) : (
                        <Image
                            source={{ uri: getAvatarUri(profile?.avatar_url) }}
                            style={styles.profileImage}
                        />
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.greetingText, { color: colors.text }]}>{getGreeting()}, {displayName}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                    style={[
                        styles.iconButton, 
                        { 
                            backgroundColor: colors.surface, 
                            borderColor: colors.border,
                            borderWidth: 1,
                        }
                    ]} 
                    onPress={() => router.push('/notifications')}
                    activeOpacity={0.8}
                >
                    <View style={styles.bellWrapper}>
                        <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
                            <Bell color={unreadCount > 0 ? '#8A2BE2' : colors.text} size={20} />
                        </Animated.View>
                        {unreadCount > 0 && (
                            <View style={[styles.notificationBadge, { borderColor: colors.surface }]}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#8A2BE2',
    },
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F1F2E',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#000',
    },
    textContainer: {
        gap: 2,
    },
    roleText: {
        color: '#8A2BE2',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    greetingText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#1F1F2E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3F',
    },
    bellWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: -7,
        right: -9,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        elevation: 3,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
    },
});

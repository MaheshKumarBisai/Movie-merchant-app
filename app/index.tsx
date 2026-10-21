import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ShieldCheck, BarChart3, Clock, ChevronRight } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                router.replace('/home');
            }
        } catch (error) {
            console.error("Auth check failed", error);
        }
    };

    const FeatureItem = ({ icon: Icon, title, description, index }: any) => (
        <Animated.View
            entering={FadeInDown.delay(400 + index * 100).duration(800)}
            style={[
                styles.featureItem,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                }
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.1)' : 'rgba(138, 43, 226, 0.08)' }]}>
                <Icon color="#8A2BE2" size={24} />
            </View>
            <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Background Image / Gradient */}
            {isDark && (
                <View style={styles.bgWrapper}>
                    <LinearGradient
                        colors={['#0B0B15', '#1A1A2E', '#0B0B15']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.glowTop} />
                </View>
            )}

            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
                        <LinearGradient
                            colors={['#8A2BE2', '#4B0082']}
                            style={styles.logoBadge}
                        >
                            <Text style={styles.logoText}>M</Text>
                        </LinearGradient>
                    </Animated.View>

                    <Animated.Text entering={FadeInUp.delay(300).duration(1000)} style={[styles.mainTitle, { color: colors.text }]}>
                        Cinema{"\n"}Partner
                    </Animated.Text>

                    <Animated.Text entering={FadeInUp.delay(400).duration(1000)} style={[styles.tagline, { color: colors.textSecondary }]}>
                        Empowering theaters with next-gen management and analytics.
                    </Animated.Text>
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                    <FeatureItem
                        icon={BarChart3}
                        title="Revenue Analytics"
                        description="Track your performance with real-time sales data."
                        index={0}
                    />
                    <FeatureItem
                        icon={Clock}
                        title="Smart Scheduling"
                        description="Manage shows and screens with an intuitive interface."
                        index={1}
                    />
                    <FeatureItem
                        icon={ShieldCheck}
                        title="Rapid Scanning"
                        description="Verify tickets instantly with our high-speed scanner."
                        index={2}
                    />
                </View>

                {/* CTA Button */}
                <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.footer}>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/auth')}
                    >
                        <LinearGradient
                            colors={['#8A2BE2', '#4B0082']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Text style={styles.ctaText}>Explore Partner Portal</Text>
                            <ChevronRight color="#FFF" size={20} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.versionMsg}>Join 200+ theaters worldwide</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    topBar: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 50,
    },
    bgWrapper: { position: 'absolute', width, height },
    glowTop: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(138, 43, 226, 0.15)',
        filter: 'blur(80px)' as any, // Blur supported in some RN versions/web
    },

    content: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 50 },

    heroSection: { alignItems: 'flex-start' },
    logoBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    mainTitle: { color: '#FFF', fontSize: 42, fontWeight: '900', lineHeight: 50, letterSpacing: -1 },
    tagline: { color: '#9CA3AF', fontSize: 16, marginTop: 16, lineHeight: 24, maxWidth: '90%' },

    featuresList: { marginTop: 20 },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(31, 31, 46, 0.5)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(138, 43, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    featureText: { flex: 1 },
    featureTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    featureDesc: { color: '#6B7280', fontSize: 13, lineHeight: 18 },

    footer: { alignItems: 'center' },
    ctaButton: { width: '100%', height: 64, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    ctaGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    ctaText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    versionMsg: { color: '#4B5563', fontSize: 12, marginTop: 20, fontWeight: '500' }
});

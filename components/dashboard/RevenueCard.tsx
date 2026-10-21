import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export const RevenueCard = ({ amount = 0 }: { amount?: number }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.border }]}>
            <LinearGradient
                colors={isDark ? ['#1F1F2E', '#14141F'] : ['#FAF5FF', '#F3E8FF']}
                style={styles.container}
            >
                <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#6B21A8' }]}>Today's Revenue</Text>

                <Text style={[styles.amount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}
                </Text>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
        borderRadius: 24,
        padding: 1,
        backgroundColor: '#2D2D3F',
        overflow: 'hidden',
    },
    container: {
        padding: 20,
        borderRadius: 24,
    },
    label: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 12,
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
    },
});

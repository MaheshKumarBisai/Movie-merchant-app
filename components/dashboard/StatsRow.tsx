import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ticket, Armchair } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const StatCard = ({ icon: Icon, label, value, progress, color, cardBg, borderColor, textColor, labelColor, trackBg }: any) => (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Icon size={20} color={color} style={{ marginBottom: 12 }} />
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.value, { color: textColor }]}>{value}</Text>

        <View style={[styles.progressContainer, { backgroundColor: trackBg }]}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
    </View>
);

export const StatsRow = ({ tickets = 0, occupancy = 0 }: { tickets?: number, occupancy?: number }) => {
    const { colors, isDark } = useTheme();
    // Dynamic target for tickets sold progress bar (e.g., 100 as a milestone)
    const ticketTarget = 100;
    const ticketProgress = Math.min((tickets / ticketTarget) * 100, 100);

    return (
        <View style={styles.container}>
            <StatCard
                icon={Ticket}
                label="Tickets Sold"
                value={tickets.toString()}
                progress={ticketProgress}
                color="#8A2BE2" // Purple
                cardBg={colors.surface}
                borderColor={colors.border}
                textColor={colors.text}
                labelColor={colors.textSecondary}
                trackBg={isDark ? '#2D2D3F' : '#F3E8FF'}
            />
            <StatCard
                icon={Armchair}
                label="Occupancy"
                value={`${occupancy}%`}
                progress={occupancy}
                color="#8A2BE2"
                cardBg={colors.surface}
                borderColor={colors.border}
                textColor={colors.text}
                labelColor={colors.textSecondary}
                trackBg={isDark ? '#2D2D3F' : '#F3E8FF'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        backgroundColor: '#1F1F2E',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2D2D3F',
    },
    label: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#2D2D3F',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});

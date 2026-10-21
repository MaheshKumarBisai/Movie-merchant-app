import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SeatGridProps {
    rows: number;
    cols: number;
    blockedSeats: string[];
    onToggleSeat: (seatId: string) => void;
}

export const SeatGrid = ({ rows, cols, blockedSeats, onToggleSeat }: SeatGridProps) => {
    const { colors, isDark } = useTheme();

    // Generate row labels (A, B, C...)
    const getRowLabel = (index: number) => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (index < 26) return alphabet[index];
        return `R${index + 1}`;
    };

    const renderGrid = () => {
        const grid = [];
        for (let r = 0; r < rows; r++) {
            const rowLabel = getRowLabel(r);
            const rowSeats = [];
            for (let c = 1; c <= cols; c++) {
                const seatId = `${rowLabel}${c}`;
                const isBlocked = blockedSeats.includes(seatId);

                rowSeats.push(
                    <TouchableOpacity
                        key={seatId}
                        style={[
                            styles.seat,
                            isBlocked ? styles.blockedSeat : styles.availableSeat
                        ]}
                        onPress={() => onToggleSeat(seatId)}
                    >
                        <Text style={[styles.seatText, { color: colors.text }]}>{seatId}</Text>
                    </TouchableOpacity>
                );
            }
            grid.push(
                <View key={`row-${r}`} style={styles.row}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{rowLabel}</Text>
                    <View style={styles.seatsContainer}>
                        {rowSeats}
                    </View>
                </View>
            );
        }
        return grid;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.screen, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.2)' : 'rgba(138, 43, 226, 0.12)' }]}>
                <Text style={[styles.screenText, { color: colors.textSecondary }]}>SCREEN</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                    {renderGrid()}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1F1F2E',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3F',
    },
    screen: {
        width: '80%',
        height: 4,
        backgroundColor: '#8A2BE2',
        borderRadius: 2,
        marginBottom: 8,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
    },
    screenText: {
        color: '#8A2BE2',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 2,
    },
    gridContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowLabel: {
        color: '#6B7280',
        width: 20,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 8,
    },
    seatsContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    seat: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    availableSeat: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10B981',
    },
    blockedSeat: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#F59E0B',
    },
    seatText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    hint: {
        color: '#4B5563',
        fontSize: 10,
        letterSpacing: 1,
        marginTop: 10,
    },
});

import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/dashboard/Header';
import { RevenueCard } from '../../components/dashboard/RevenueCard';
import { StatsRow } from '../../components/dashboard/StatsRow';
import { SalesChart } from '../../components/dashboard/SalesChart';
import { QuickActions } from '../../components/dashboard/QuickActions';

import { Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { stats, loading, error, refetch } = useDashboardStats();
    const { colors } = useTheme();

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header />
                <ScrollView 
                    contentContainerStyle={[styles.content, styles.errorContainer]}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#8A2BE2" />}
                >
                    <Text style={styles.errorTitle}>Access Restricted</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const displayStats = stats || {
        revenue_today: 0,
        tickets_sold_today: 0,
        occupancy_percentage: 0,
        active_movies_count: 0,
        sales_trend: [0, 0, 0, 0, 0, 0, 0]
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Fixed Header without outline */}
            <View style={styles.fixedHeader}>
                <Header />
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#8A2BE2" />}
            >
                <RevenueCard
                    amount={displayStats.revenue_today}
                />
                <StatsRow
                    tickets={displayStats.tickets_sold_today}
                    occupancy={displayStats.occupancy_percentage}
                />
                <QuickActions />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    fixedHeader: {
        paddingHorizontal: width * 0.05,
        paddingTop: 8,
        borderBottomWidth: 0, // No outline
    },
    content: { 
        paddingHorizontal: width * 0.05,
        paddingTop: 8,
        paddingBottom: 40 
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: Dimensions.get('window').height * 0.6,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff4444',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 24,
    },
});

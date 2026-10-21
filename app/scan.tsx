import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        setScanned(true);

        // Expected format: BOOKING:MOVIE_ID:BOOKING_ID
        const parts = data.split(':');
        if (parts[0] !== 'BOOKING' || parts.length < 3) {
            Alert.alert('Invalid QR Code', 'This is not a valid movie ticket QR code.', [
                { text: 'Try Again', onPress: () => setScanned(false) }
            ]);
            return;
        }

        const bookingId = parseInt(parts[2]);
        if (isNaN(bookingId)) {
            Alert.alert('Error', 'Could not parse booking ID.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(endpoints.merchant.checkIn, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ booking_id: bookingId })
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Ticket checked-in successfully!', [
                    { text: 'Done', onPress: () => router.back() },
                    { text: 'Scan Another', onPress: () => setScanned(false) }
                ]);
            } else {
                throw new Error(result.detail || 'Failed to check-in');
            }
        } catch (error: any) {
            Alert.alert('Check-in Failed', error.message, [
                { text: 'Try Again', onPress: () => setScanned(false) }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator color="#8A2BE2" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Scan Ticket</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />

                {/* Overlay UI */}
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.hintText}>Position the QR code within the frame</Text>
                </View>
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                    <Text style={styles.loadingText}>Checking in...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
        paddingTop: 60,
        marginBottom: 20
    },
    backBtn: { padding: 8, backgroundColor: '#1F1F2E', borderRadius: 20 },
    title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    cameraContainer: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
    camera: { flex: 1 },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#8A2BE2',
        borderRadius: 24,
        backgroundColor: 'transparent',
    },
    hintText: {
        color: '#FFF',
        marginTop: 24,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 40,
    },

    errorText: { color: '#FFF', textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
    button: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
    buttonText: { color: '#FFF', fontWeight: 'bold' },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { color: '#FFF', marginTop: 12, fontSize: 16, fontWeight: '600' }
});

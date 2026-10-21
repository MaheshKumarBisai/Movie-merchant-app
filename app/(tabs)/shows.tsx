import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar, Monitor, Clock, X, Plus, Film, Check, Edit, Trash2, PlusCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { endpoints } from '../../config/api';
import { uploadImageViaXHR } from '../../utils/upload';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ShowsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    // Data State
    const [searchQuery, setSearchQuery] = useState('');
    const [movies, setMovies] = useState<any[]>([]);
    const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
    const [screens, setScreens] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAddMovie, setShowAddMovie] = useState(false);
    const [showEditShowtimes, setShowEditShowtimes] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Selection State for Edit Showtimes modal
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [customTime, setCustomTime] = useState('');
    const [ticketPrice, setTicketPrice] = useState('150');
    const [selectedShowLanguage, setSelectedShowLanguage] = useState('');

    // Add Movie Form State
    const [newMovie, setNewMovie] = useState({
        title: '', language: '', duration: '', description: '', cast: '', poster: '', status: 'ACTIVE', releaseDate: ''
    });

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        if (searchQuery) {
            setFilteredMovies(movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredMovies(movies);
        }
    }, [searchQuery, movies]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('token');

            const moviesRes = await fetch(endpoints.merchant.movies, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (moviesRes.ok) {
                const moviesData = await moviesRes.json();
                setMovies(moviesData);
                setFilteredMovies(moviesData);
            }

            const screensRes = await fetch(endpoints.merchant.screens, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (screensRes.ok) {
                const screensData = await screensRes.json();
                setScreens(screensData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ─── Movie CRUD ───────────────────────────────────────────────────

    const resetMovieForm = () => {
        setNewMovie({ title: '', language: '', duration: '', description: '', cast: '', poster: '', status: 'ACTIVE', releaseDate: '' });
        setIsEditing(false);
    };

    const pickPosterImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewMovie({ ...newMovie, poster: result.assets[0].uri });
        }
    };

    const handleSaveMovie = async () => {
        if (!newMovie.title || !newMovie.language || !newMovie.duration) {
            Alert.alert('Error', 'Title, Language and Duration are required');
            return;
        }
        try {
            setSubmitting(true);
            const token = await SecureStore.getItemAsync('token');

            // Upload poster to S3
            let posterUrl = newMovie.poster;
            if (posterUrl && (posterUrl.startsWith('file://') || posterUrl.startsWith('content://'))) {
                // Local file — upload directly via XHR to prevent WinterCG fetch FormDataPart errors
                try {
                    posterUrl = await uploadImageViaXHR(endpoints.uploadImage, token, posterUrl, 'profiles/merchant/movies');
                } catch (uploadErr: any) {
                    console.error('Poster upload failed:', uploadErr);
                    Alert.alert('Upload Failed', uploadErr.message || 'Failed to upload poster image');
                    setSubmitting(false);
                    return;
                }
            }

            const url = isEditing && selectedMovie
                ? `${endpoints.merchant.movies}/${selectedMovie.id}`
                : endpoints.merchant.movies;

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: newMovie.title,
                    language: newMovie.language,
                    duration_minutes: parseInt(newMovie.duration),
                    description: newMovie.description,
                    cast_members: newMovie.cast,
                    poster_url: posterUrl,
                    status: newMovie.status,
                    release_date: newMovie.releaseDate || null
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Failed to ${isEditing ? 'update' : 'create'} movie`);
            }
            Alert.alert('Success', `Movie ${isEditing ? 'updated' : 'added'} successfully`);
            await fetchData();
            setShowAddMovie(false);
            resetMovieForm();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditMovie = (movie: any) => {
        setSelectedMovie(movie);
        setNewMovie({
            title: movie.title,
            language: movie.language,
            duration: movie.duration_minutes?.toString() || '',
            description: movie.description || '',
            cast: movie.cast_members || '',
            poster: movie.poster_url || '',
            status: movie.status || 'ACTIVE',
            releaseDate: movie.release_date || ''
        });
        setIsEditing(true);
        setShowAddMovie(true);
    };

    const handleDeleteMovie = (movie: any) => {
        Alert.alert(
            "Delete Options",
            `Choose an action for "${movie.title}":`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Shows Only",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await SecureStore.getItemAsync('token');
                            const response = await fetch(`${endpoints.merchant.movies}/${movie.id}/shows`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!response.ok) throw new Error("Failed to delete shows");
                            const result = await response.json();
                            Alert.alert("Success", result.message);
                            fetchData();
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                },
                {
                    text: "Delete Movie & Shows",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await SecureStore.getItemAsync('token');
                            // First delete all shows
                            await fetch(`${endpoints.merchant.movies}/${movie.id}/shows`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            // Then delete the movie
                            const response = await fetch(`${endpoints.merchant.movies}/${movie.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!response.ok) {
                                const err = await response.json();
                                throw new Error(err.detail || "Failed to delete movie");
                            }
                            Alert.alert("Success", "Movie and all its shows deleted");
                            fetchData();
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // ─── Showtime Scheduling ────────────────────────────────────────

    const openEditShowtimes = (movie: any) => {
        setSelectedMovie(movie);
        setSelectedScreenId(null);
        setSelectedDates([]);
        setSelectedTimes([]);
        setSelectedShowLanguage(movie.language || '');
        setTicketPrice('150');
        setShowEditShowtimes(true);
    };

    const handleAddTime = () => {
        if (!customTime) return;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(customTime)) {
            Alert.alert('Invalid Time', 'Format must be HH:MM');
            return;
        }
        if (!selectedTimes.includes(customTime)) {
            setSelectedTimes([...selectedTimes, customTime].sort());
        }
        setCustomTime('');
    };

    const toggleTime = (time: string) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(selectedTimes.filter(t => t !== time));
        } else {
            setSelectedTimes([...selectedTimes, time].sort());
        }
    };

    const toggleDate = (date: Date) => {
        const dateStr = date.toDateString();
        const exists = selectedDates.find(d => d.toDateString() === dateStr);
        if (exists) {
            setSelectedDates(selectedDates.filter(d => d.toDateString() !== dateStr));
        } else {
            setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
        }
    };

    const handlePublishShows = async () => {
        if (!selectedMovie) return;
        if (!selectedScreenId) { Alert.alert('Missing Info', 'Please select a screen'); return; }
        if (selectedDates.length === 0) { Alert.alert('Missing Info', 'Select at least one date'); return; }

        // Auto-include custom time if it was typed but not added via +
        let timesToPublish = [...selectedTimes];
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (customTime && timeRegex.test(customTime) && !timesToPublish.includes(customTime)) {
            timesToPublish = [...timesToPublish, customTime].sort();
            setSelectedTimes(timesToPublish);
            setCustomTime('');
        }

        if (timesToPublish.length === 0) { Alert.alert('Missing Info', 'Select at least one time slot'); return; }

        try {
            setSubmitting(true);
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(endpoints.merchant.batchShows, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    movie_id: selectedMovie.id,
                    screen_id: selectedScreenId,
                    dates: selectedDates.map(d => d.toISOString()),
                    times: timesToPublish,
                    price: parseFloat(ticketPrice) || 150.0,
                    language: selectedShowLanguage
                })
            });

            if (!response.ok) throw new Error("Failed to publish shows");
            const result = await response.json();
            Alert.alert('Success', `${result.count} showtimes published!`);
            setShowEditShowtimes(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const generateNextDays = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const generateCommonTimes = () => ['10:30', '13:15', '16:00', '19:00', '21:30'];

    // ─── RENDER ─────────────────────────────────────────────────────

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Fixed Header without outline */}
            <View style={styles.fixedHeader}>
                <Text style={[styles.screenTitle, { color: colors.text }]}>Movies & Shows</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Search */}
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
                    <Search size={18} color="#8A2BE2" style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search your inventory..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Add New Movie */}
                <TouchableOpacity style={styles.addNewBtn} onPress={() => { resetMovieForm(); setShowAddMovie(true); }}>
                    <PlusCircle size={22} color="#FFF" />
                    <Text style={styles.addNewBtnText}>Add New Movie</Text>
                </TouchableOpacity>

                {/* Section: Active Screening */}
                <View style={styles.sectionRow}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVE SCREENING</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                            {filteredMovies.filter(m => m.status === 'ACTIVE' || !m.status).length} MOVIES
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 40 }} />
                ) : (
                    filteredMovies.filter(m => m.status === 'ACTIVE' || !m.status).map(movie => (
                        <View key={movie.id} style={[styles.movieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.movieCardTop}>
                                {movie.poster_url ? (
                                    <Image source={{ uri: movie.poster_url }} style={styles.moviePoster} />
                                ) : (
                                    <View style={[styles.moviePoster, { backgroundColor: isDark ? '#2D2D3F' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Film size={24} color="#8A2BE2" />
                                    </View>
                                )}
                                <View style={styles.movieInfo}>
                                    <Text style={[styles.movieTitle, { color: colors.text }]}>{movie.title}</Text>
                                    <Text style={[styles.movieMeta, { color: colors.textSecondary }]}>
                                        {movie.duration_minutes} min • {movie.language}
                                    </Text>
                                    <View style={styles.movieActions}>
                                        <TouchableOpacity onPress={() => handleEditMovie(movie)} style={styles.actionBtn}>
                                            <Edit size={14} color="#8A2BE2" />
                                            <Text style={styles.actionText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteMovie(movie)} style={styles.actionBtn}>
                                            <Trash2 size={14} color="#EF4444" />
                                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.editShowtimesBtn, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.15)' : 'rgba(138, 43, 226, 0.08)' }]} onPress={() => openEditShowtimes(movie)}>
                                <Calendar size={16} color="#8A2BE2" />
                                <Text style={[styles.editShowtimesBtnText, { color: '#8A2BE2' }]}>Edit Showtimes</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                {/* Section: Coming Soon */}
                {filteredMovies.filter(m => m.status === 'COMING_SOON').length > 0 && (
                    <View style={[styles.sectionRow, { marginTop: 24 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COMING SOON</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>
                                {filteredMovies.filter(m => m.status === 'COMING_SOON').length} MOVIES
                            </Text>
                        </View>
                    </View>
                )}

                {!loading && filteredMovies.filter(m => m.status === 'COMING_SOON').map(movie => (
                    <View key={movie.id} style={[styles.movieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.movieCardTop}>
                            {movie.poster_url ? (
                                <Image source={{ uri: movie.poster_url }} style={styles.moviePoster} />
                            ) : (
                                <View style={[styles.moviePoster, { backgroundColor: isDark ? '#2D2D3F' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Film size={24} color="#8A2BE2" />
                                </View>
                            )}
                            <View style={styles.movieInfo}>
                                <Text style={[styles.movieTitle, { color: colors.text }]}>{movie.title}</Text>
                                <Text style={[styles.movieMeta, { color: colors.textSecondary }]}>
                                    {movie.duration_minutes} min • {movie.language}
                                </Text>
                                <View style={styles.movieActions}>
                                    <TouchableOpacity onPress={() => handleEditMovie(movie)} style={styles.actionBtn}>
                                        <Edit size={14} color="#8A2BE2" />
                                        <Text style={styles.actionText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteMovie(movie)} style={styles.actionBtn}>
                                        <Trash2 size={14} color="#EF4444" />
                                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.editShowtimesBtn, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.15)' : 'rgba(138, 43, 226, 0.08)' }]} onPress={() => openEditShowtimes(movie)}>
                            <Calendar size={16} color="#8A2BE2" />
                            <Text style={[styles.editShowtimesBtnText, { color: '#8A2BE2' }]}>Edit Showtimes</Text>
                        </TouchableOpacity>
                    </View>
                ))}

            </ScrollView>

            {/* ─── Add / Edit Movie Modal ───────────────────────────── */}
            <Modal visible={showAddMovie} animationType="slide" transparent={false} statusBarTranslucent={true}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 0 : 40 }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{isEditing ? 'Edit Movie' : 'Add New Movie'}</Text>
                        <TouchableOpacity onPress={() => { setShowAddMovie(false); resetMovieForm(); }}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                {newMovie.poster ? (
                                    <Image source={{ uri: newMovie.poster }} style={{ width: 120, height: 180, borderRadius: 12 }} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.posterPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <Film size={40} color="#8A2BE2" />
                                        <Text style={[styles.posterText, { color: colors.textSecondary }]}>Poster Preview</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Movie Title *</Text>
                            <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newMovie.title} onChangeText={t => setNewMovie({ ...newMovie, title: t })} placeholder="e.g. Inception" placeholderTextColor={colors.textSecondary} />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Language *</Text>
                                    <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newMovie.language} onChangeText={t => setNewMovie({ ...newMovie, language: t })} placeholder="e.g. English" placeholderTextColor={colors.textSecondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Duration (min) *</Text>
                                    <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newMovie.duration} onChangeText={t => setNewMovie({ ...newMovie, duration: t })} placeholder="148" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
                            <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, height: 80 }]} multiline value={newMovie.description} onChangeText={t => setNewMovie({ ...newMovie, description: t })} placeholder="Movie plot..." placeholderTextColor={colors.textSecondary} />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cast (comma separated)</Text>
                            <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newMovie.cast} onChangeText={t => setNewMovie({ ...newMovie, cast: t })} placeholder="Actor 1, Actor 2..." placeholderTextColor={colors.textSecondary} />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Poster Image</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { flex: 1, backgroundColor: isDark ? '#374151' : '#F3E8FF', marginTop: 0 }]}
                                    onPress={pickPosterImage}
                                >
                                    <Text style={[styles.primaryBtnText, { color: isDark ? '#FFF' : '#8A2BE2' }]}>Pick from Gallery</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newMovie.poster} onChangeText={t => setNewMovie({ ...newMovie, poster: t })} placeholder="Or paste URL: https://..." placeholderTextColor={colors.textSecondary} />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Movie Status</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                <TouchableOpacity
                                    style={[styles.statusOption, { backgroundColor: colors.surface, borderColor: colors.border }, newMovie.status === 'ACTIVE' && styles.statusOptionActive]}
                                    onPress={() => setNewMovie({ ...newMovie, status: 'ACTIVE' })}
                                >
                                    <Text style={[styles.statusOptionText, newMovie.status === 'ACTIVE' ? { color: '#FFF' } : { color: colors.textSecondary }]}>Active Screening</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusOption, { backgroundColor: colors.surface, borderColor: colors.border }, newMovie.status === 'COMING_SOON' && styles.statusOptionActive]}
                                    onPress={() => setNewMovie({ ...newMovie, status: 'COMING_SOON' })}
                                >
                                    <Text style={[styles.statusOptionText, newMovie.status === 'COMING_SOON' ? { color: '#FFF' } : { color: colors.textSecondary }]}>Coming Soon</Text>
                                </TouchableOpacity>
                            </View>

                            {newMovie.status === 'COMING_SOON' && (
                                <View style={{ marginBottom: 24, padding: 16, backgroundColor: isDark ? 'rgba(138, 43, 226, 0.05)' : '#F9F5FF', borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 0 }]}>Release Date (YYYY-MM-DD)</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                        value={newMovie.releaseDate}
                                        onChangeText={t => setNewMovie({ ...newMovie, releaseDate: t })}
                                        placeholder="e.g. 2027-12-15"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                                        When will audiences be able to book tickets for this?
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveMovie} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{isEditing ? 'Save Changes' : 'Add Movie'}</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* ─── Edit Showtimes Modal ──────────────────────────────── */}
            <Modal visible={showEditShowtimes} animationType="slide" transparent={false} statusBarTranslucent={true}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 0 : 40 }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Showtimes</Text>
                            {selectedMovie && <Text style={styles.modalSubtitle}>{selectedMovie.title}</Text>}
                        </View>
                        <TouchableOpacity onPress={() => setShowEditShowtimes(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalContent}
                            keyboardShouldPersistTaps="handled"
                        >

                            {/* Screen Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT SCREEN</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                                {screens.map(screen => (
                                    <TouchableOpacity
                                        key={screen.id}
                                        style={[styles.screenCard, { backgroundColor: colors.surface, borderColor: colors.border }, selectedScreenId === screen.id && styles.activeScreenCard]}
                                        onPress={() => setSelectedScreenId(screen.id)}
                                    >
                                        <Monitor size={20} color={selectedScreenId === screen.id ? '#8A2BE2' : colors.textSecondary} style={{ marginBottom: 8 }} />
                                        <Text style={[styles.screenName, { color: colors.text }, selectedScreenId === screen.id && { color: '#8A2BE2' }]}>{screen.name}</Text>
                                        <Text style={[styles.screenTech, { color: colors.textSecondary }]}>{screen.technology || 'Standard'}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Date Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT DATES ({selectedDates.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                                {generateNextDays().map((date, index) => {
                                    const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                                    return (
                                        <TouchableOpacity key={index} style={[styles.dateCard, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && styles.activeDateCard]} onPress={() => toggleDate(date)}>
                                            <Text style={[styles.dateDay, { color: colors.textSecondary }, isSelected && styles.activeDateText]}>
                                                {date.toLocaleString('default', { weekday: 'short' })}
                                            </Text>
                                            <Text style={[styles.dateNum, { color: colors.text }, isSelected && styles.activeDateText]}>
                                                {date.getDate()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Time Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>SHOW TIMINGS ({selectedTimes.length})</Text>
                            <View style={styles.timeGrid}>
                                {generateCommonTimes().map(time => {
                                    const isSelected = selectedTimes.includes(time);
                                    return (
                                        <TouchableOpacity key={time} style={[styles.timeChip, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && styles.activeTimeChip]} onPress={() => toggleTime(time)}>
                                            <Text style={[styles.timeText, { color: colors.textSecondary }, isSelected && { color: '#FFF' }]}>{time}</Text>
                                            {isSelected && <Check size={14} color="#FFF" style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Custom Time */}
                            <View style={styles.timeInputContainer}>
                                <TextInput
                                    style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                    placeholder="Custom HH:MM"
                                    placeholderTextColor={colors.textSecondary}
                                    value={customTime}
                                    onChangeText={setCustomTime}
                                    keyboardType="numbers-and-punctuation"
                                    maxLength={5}
                                />
                                <TouchableOpacity style={styles.addTimeBtn} onPress={handleAddTime}>
                                    <Plus size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Language Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>SHOW LANGUAGE</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                                {Array.from(new Set([
                                    selectedMovie?.language,
                                    ...(selectedMovie?.languages || '').split(',').map((l: string) => l.trim())
                                ])).filter(Boolean).map((lang: any) => (
                                    <TouchableOpacity
                                        key={lang}
                                        style={[styles.languageChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedShowLanguage === lang && styles.activeTimeChip]}
                                        onPress={() => setSelectedShowLanguage(lang)}
                                    >
                                        <Text style={[styles.timeText, { color: colors.textSecondary }, selectedShowLanguage === lang && { color: '#FFF' }]}>{lang}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Price Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>BASE TICKET PRICE (₹)</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                                placeholder="e.g. 150 (Regular)"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={ticketPrice}
                                onChangeText={setTicketPrice}
                            />
                            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 24 }}>
                                Premium (+₹100) and Recliner (+₹200) prices are automatically calculated based on this base price.
                            </Text>

                            <View style={styles.selectedTimeList}>
                                {selectedTimes.map(time => (
                                    <View key={time} style={[styles.selectedTimeChip, { backgroundColor: isDark ? '#2E2E40' : '#F3E8FF', borderColor: '#8A2BE2' }]}>
                                        <Text style={[styles.selectedTimeText, { color: isDark ? '#FFF' : '#8A2BE2' }]}>{time}</Text>
                                        <TouchableOpacity onPress={() => toggleTime(time)}>
                                            <X size={14} color={isDark ? "#9CA3AF" : "#8A2BE2"} style={{ marginLeft: 6 }} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>

                    <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                        <TouchableOpacity style={styles.publishButton} onPress={handlePublishShows} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>PUBLISH SHOWTIMES</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    fixedHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 6,
        borderBottomWidth: 0, // No outline
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    scrollContent: { padding: 20, paddingTop: 4, paddingBottom: 20 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
    headerSubtitle: { color: '#A855F7', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: 4 },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8A2BE2', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // Search
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1F2E', borderRadius: 14, paddingHorizontal: 16, height: 50, marginBottom: 16, borderWidth: 1, borderColor: '#2D2D3F' },
    searchInput: { flex: 1, color: '#FFF', fontSize: 15 },

    // Add New
    addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8A2BE2', borderRadius: 14, paddingVertical: 14, gap: 10, marginBottom: 28 },
    addNewBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Section
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 },
    countBadge: { borderWidth: 1, borderColor: '#8A2BE2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    countBadgeText: { color: '#A855F7', fontSize: 11, fontWeight: '600' },

    // Movie Card
    movieCard: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2D2D3F' },
    movieCardTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
    moviePoster: { width: 70, height: 100, borderRadius: 10 },
    movieInfo: { flex: 1, justifyContent: 'center' },
    movieTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
    movieMeta: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
    movieActions: { flexDirection: 'row', gap: 14 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { color: '#8A2BE2', fontSize: 12, fontWeight: '600' },
    editShowtimesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(138, 43, 226, 0.15)', borderRadius: 12, paddingVertical: 12, gap: 8 },
    editShowtimesBtnText: { color: '#C084FC', fontWeight: '600', fontSize: 14 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#0B0B15' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F1F2E' },
    modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    modalSubtitle: { color: '#A855F7', fontSize: 13, marginTop: 2 },
    closeText: { color: '#8A2BE2', fontSize: 16, fontWeight: '600' },
    modalContent: { padding: 20, paddingBottom: 100 },
    posterPlaceholder: { width: 120, height: 180, backgroundColor: '#1F1F2E', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#2D2D3F' },
    posterText: { color: '#4B5563', fontSize: 11, textAlign: 'center', marginTop: 8 },
    inputLabel: { color: '#9CA3AF', marginBottom: 8, fontSize: 12, marginTop: 12 },
    modalInput: { backgroundColor: '#1F1F2E', borderRadius: 12, padding: 14, color: '#FFF', borderWidth: 1, borderColor: '#2D2D3F', fontSize: 15 },
    primaryBtn: { backgroundColor: '#8A2BE2', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 32 },
    primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    statusOption: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1F1F2E', borderWidth: 1, borderColor: '#2D2D3F', alignItems: 'center' },
    statusOptionActive: { backgroundColor: '#4B0082', borderColor: '#8A2BE2' },
    statusOptionText: { color: '#9CA3AF', fontWeight: 'bold' },

    // Showtimes modal
    label: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
    screenCard: { width: 120, padding: 16, borderRadius: 16, backgroundColor: '#1F1F2E', marginRight: 12, borderWidth: 1, borderColor: '#2D2D3F' },
    activeScreenCard: { borderColor: '#8A2BE2', backgroundColor: 'rgba(138, 43, 226, 0.1)' },
    screenName: { color: '#FFF', fontWeight: 'bold', marginBottom: 4 },
    screenTech: { color: '#9CA3AF', fontSize: 12 },
    dateCard: { width: 60, height: 70, borderRadius: 12, backgroundColor: '#1F1F2E', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#2D2D3F' },
    activeDateCard: { backgroundColor: '#8A2BE2', borderColor: '#8A2BE2' },
    dateDay: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
    dateNum: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    activeDateText: { color: '#FFF' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1F1F2E', borderWidth: 1, borderColor: '#2D2D3F', flexDirection: 'row', alignItems: 'center' },
    activeTimeChip: { backgroundColor: '#4B0082', borderColor: '#8A2BE2' },
    timeText: { color: '#9CA3AF', fontWeight: '600' },
    languageChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1F1F2E', borderWidth: 1, borderColor: '#2D2D3F' },
    timeInputContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    timeInput: { flex: 1, backgroundColor: '#1F1F2E', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', borderWidth: 1, borderColor: '#2D2D3F', height: 48 },
    addTimeBtn: { width: 48, backgroundColor: '#8A2BE2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    selectedTimeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    selectedTimeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#2E2E40', borderWidth: 1, borderColor: '#8A2BE2' },
    selectedTimeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0B0B15', borderTopWidth: 1, borderTopColor: '#1F1F2E' },
    publishButton: { backgroundColor: '#8A2BE2', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16 },
    publishText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Search, MapPin, ChevronDown, Check, Plus, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';

interface CityDropdownPickerProps {
    value: string;
    onChangeCity: (city: string) => void;
    placeholder?: string;
}

// Major cities and district headquarters of Andhra Pradesh
export const ANDHRA_PRADESH_CITIES = [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Kurnool',
    'Rajahmundry',
    'Tirupati',
    'Kakinada',
    'Anantapur',
    'Kadapa',
    'Vizianagaram',
    'Eluru',
    'Ongole',
    'Nandyal',
    'Machilipatnam',
    'Adoni',
    'Tenali',
    'Proddatur',
    'Chittoor',
    'Hindupur',
    'Bhimavaram',
    'Madanapalle',
    'Guntakal',
    'Srikakulam',
    'Dharmavaram',
    'Gudivada',
    'Narasaraopet',
    'Tadipatri',
    'Mangalagiri',
    'Chilakaluripet',
    'Anakapalle',
    'Bapatla',
    'Amalapuram',
    'Markapur',
    'Palakollu',
    'Rayachoti',
    'Tanuku',
    'Kavali',
    'Palasa',
    'Pithapuram',
    'Ponnur',
    'Samalkota',
    'Sattenapalle',
    'Tuni',
    'Vinukonda',
    'Yemmiganur',
    'Kandukur',
    'Repalle',
    'Rayadurg',
    'Jaggayyapet',
];

const toTitleCase = (str: string) => {
    return str
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const CityDropdownPicker: React.FC<CityDropdownPickerProps> = ({
    value,
    onChangeCity,
    placeholder = 'Select city (e.g. Vijayawada, Visakhapatnam)',
}) => {
    const { colors, isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dbCities, setDbCities] = useState<string[]>([]);

    useEffect(() => {
        fetchDbCities();
    }, []);

    const fetchDbCities = async () => {
        try {
            const response = await fetch(endpoints.locations);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setDbCities(data.map(c => toTitleCase(c)));
                }
            }
        } catch (e) {
            console.log('Error fetching db cities in dropdown:', e);
        }
    };

    // Combine standard AP cities and DB cities, deduplicating case-insensitively
    const allCities = useMemo(() => {
        const cityMap = new Map<string, string>();

        ANDHRA_PRADESH_CITIES.forEach(city => {
            cityMap.set(city.toLowerCase(), city);
        });

        dbCities.forEach(city => {
            if (city) {
                const lower = city.toLowerCase();
                if (!cityMap.has(lower)) {
                    cityMap.set(lower, city);
                }
            }
        });

        return Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b));
    }, [dbCities]);

    const filteredCities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return allCities;
        return allCities.filter(c => c.toLowerCase().includes(query));
    }, [allCities, searchQuery]);

    const formattedCustomCity = useMemo(() => {
        const q = searchQuery.trim();
        if (!q) return null;
        const titled = toTitleCase(q);
        const exists = allCities.some(c => c.toLowerCase() === titled.toLowerCase());
        return exists ? null : titled;
    }, [searchQuery, allCities]);

    const handleSelect = (city: string) => {
        onChangeCity(toTitleCase(city));
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            {/* Header Trigger Box */}
            <TouchableOpacity
                style={[
                    styles.selectorBox,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isOpen ? '#8A2BE2' : colors.border,
                        borderBottomLeftRadius: isOpen ? 0 : 12,
                        borderBottomRightRadius: isOpen ? 0 : 12,
                    },
                ]}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}
            >
                <View style={styles.selectorLeft}>
                    <MapPin color="#8A2BE2" size={20} style={{ marginRight: 10 }} />
                    <Text
                        style={[
                            styles.selectorText,
                            { color: value ? colors.text : colors.textSecondary },
                        ]}
                        numberOfLines={1}
                    >
                        {value || placeholder}
                    </Text>
                </View>
                <ChevronDown
                    color={isOpen ? '#8A2BE2' : colors.textSecondary}
                    size={18}
                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {/* Inline Mixed Dropdown (Search Bar + Cities List) - Non-modal so Bottom Nav Bar stays clickable! */}
            {isOpen && (
                <View
                    style={[
                        styles.dropdownBody,
                        {
                            backgroundColor: colors.surface,
                            borderColor: '#8A2BE2',
                        },
                    ]}
                >
                    {/* Search Bar mixed right inside the dropdown */}
                    <View
                        style={[
                            styles.searchContainer,
                            {
                                backgroundColor: isDark ? '#141422' : '#F3E8FF',
                                borderBottomColor: colors.border,
                            },
                        ]}
                    >
                        <Search size={16} color="#8A2BE2" style={{ marginRight: 8 }} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search city in Andhra Pradesh..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Custom City prompt if typed something not in list */}
                    {formattedCustomCity && (
                        <TouchableOpacity
                            style={[
                                styles.customOption,
                                {
                                    backgroundColor: isDark ? 'rgba(138, 43, 226, 0.15)' : 'rgba(138, 43, 226, 0.08)',
                                    borderBottomColor: colors.border,
                                },
                            ]}
                            onPress={() => handleSelect(formattedCustomCity)}
                        >
                            <Plus size={16} color="#8A2BE2" style={{ marginRight: 8 }} />
                            <Text style={styles.customOptionText}>
                                Select "{formattedCustomCity}" as city
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Scrollable List of Cities */}
                    <ScrollView
                        style={styles.listScroll}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                    >
                        {filteredCities.map(city => {
                            const isSelected = value.toLowerCase() === city.toLowerCase();
                            return (
                                <TouchableOpacity
                                    key={city}
                                    style={[
                                        styles.cityRow,
                                        { borderBottomColor: colors.border },
                                        isSelected && {
                                            backgroundColor: isDark ? 'rgba(138, 43, 226, 0.2)' : 'rgba(138, 43, 226, 0.1)',
                                        },
                                    ]}
                                    onPress={() => handleSelect(city)}
                                >
                                    <View style={styles.cityRowLeft}>
                                        <MapPin
                                            size={15}
                                            color={isSelected ? '#8A2BE2' : colors.textSecondary}
                                            style={{ marginRight: 10 }}
                                        />
                                        <Text
                                            style={[
                                                styles.cityName,
                                                {
                                                    color: isSelected ? '#8A2BE2' : colors.text,
                                                    fontWeight: isSelected ? 'bold' : 'normal',
                                                },
                                            ]}
                                        >
                                            {city}
                                        </Text>
                                    </View>
                                    {isSelected && <Check size={16} color="#8A2BE2" />}
                                </TouchableOpacity>
                            );
                        })}

                        {filteredCities.length === 0 && !formattedCustomCity && (
                            <View style={styles.emptyRow}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No matching city found
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    selectorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
    },
    selectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    selectorText: {
        fontSize: 16,
        flex: 1,
    },
    dropdownBody: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 48,
        borderBottomWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
    },
    customOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    customOptionText: {
        color: '#8A2BE2',
        fontSize: 14,
        fontWeight: '600',
    },
    listScroll: {
        maxHeight: 220,
    },
    cityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
    },
    cityRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cityName: {
        fontSize: 15,
    },
    emptyRow: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
    },
});

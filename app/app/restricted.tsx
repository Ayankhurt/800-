import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RestrictedScreen() {
    const { colors } = useAuth();
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.text, { color: colors.text }]}>Restricted Area</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 18, fontWeight: 'bold' },
});

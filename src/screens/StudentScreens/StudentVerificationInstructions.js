import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentVerificationInstructions({ navigation, route }) {
    const { userId } = route.params;

    const handleContinue = () => {
        navigation.navigate('StudentVerificationUpload', { userId });
    };

    const instructions = [
        {
            icon: 'card-outline',
            title: 'Prepare Your Student ID',
            description: 'Make sure your student ID is valid and not expired. You\'ll need both front and back.',
        },
        {
            icon: 'camera-outline',
            title: 'Take Clear Photos',
            description: 'Ensure good lighting and all text is readable. Avoid glare and shadows.',
        },
        {
            icon: 'person-outline',
            title: 'Take a Selfie',
            description: 'A clear selfie holding your student ID next to your face for verification.',
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Admin Review',
            description: 'Your submission will be reviewed within 24-48 hours. You\'ll be notified once approved.',
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="school" size={60} color="#E3B23C" />
                    <Text style={styles.title}>Student Verification</Text>
                    <Text style={styles.subtitle}>
                        Let's verify your student status to unlock exclusive student pricing!
                    </Text>
                </View>

                {/* What You'll Need */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What You'll Need</Text>
                    <View style={styles.needsList}>
                        <View style={styles.needItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.needText}>Valid Student ID (Front)</Text>
                        </View>
                        <View style={styles.needItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.needText}>Valid Student ID (Back)</Text>
                        </View>
                        <View style={styles.needItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.needText}>Selfie with Student ID</Text>
                        </View>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Verification Steps</Text>
                    {instructions.map((item, index) => (
                        <View key={index} style={styles.instructionCard}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon} size={24} color="#E3B23C" />
                            </View>
                            <View style={styles.instructionContent}>
                                <Text style={styles.instructionTitle}>
                                    {index + 1}. {item.title}
                                </Text>
                                <Text style={styles.instructionDescription}>
                                    {item.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Important Note */}
                <View style={styles.noteCard}>
                    <Ionicons name="information-circle" size={24} color="#E3B23C" />
                    <View style={styles.noteContent}>
                        <Text style={styles.noteTitle}>Important</Text>
                        <Text style={styles.noteText}>
                            • All photos must be clear and readable{'\n'}
                            • Make sure your ID is not expired{'\n'}
                            • Verification typically takes 24-48 hours{'\n'}
                            • You'll be notified once approved
                        </Text>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue to Upload</Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    needsList: {
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 20,
    },
    needItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    needText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 12,
    },
    instructionCard: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1400',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    instructionContent: {
        flex: 1,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    instructionDescription: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1400',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E3B23C44',
    },
    noteContent: {
        flex: 1,
        marginLeft: 12,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E3B23C',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 14,
        color: '#E3B23C',
        lineHeight: 22,
    },
    bottomContainer: {
        backgroundColor: '#191919',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
    },
    continueButton: {
        flexDirection: 'row',
        backgroundColor: '#E3B23C',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});
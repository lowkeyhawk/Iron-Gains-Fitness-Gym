import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config';
import { AuthContext } from '../../context/AuthContext';

export default function StudentVerificationUpload({ navigation, route }) {
    // 🆕 Fixed — use setUser instead of updateUser
    const { user, setUser } = useContext(AuthContext);
    const userId = user?.id;

    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack]   = useState(null);
    const [selfie, setSelfie]   = useState(null);
    const [loading, setLoading] = useState(false);

    const requestPermissions = async () => {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaPermission  = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
            Alert.alert('Permissions Required', 'Camera and gallery permissions are needed for verification.');
            return false;
        }
        return true;
    };

    const showImageOptions = (type) => {
        Alert.alert(
            'Select Photo',
            'Choose how you want to upload your photo',
            [
                { text: 'Take Photo',           onPress: () => takePhoto(type) },
                { text: 'Choose from Gallery',  onPress: () => pickImage(type) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const takePhoto = async (type) => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: type === 'selfie' ? [3, 4] : [16, 10],
            quality: 0.8,
        });

        if (!result.canceled) setPhoto(type, result.assets[0]);
    };

    const pickImage = async (type) => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: type === 'selfie' ? [3, 4] : [16, 10],
            quality: 0.8,
        });

        if (!result.canceled) setPhoto(type, result.assets[0]);
    };

    const setPhoto = (type, photo) => {
        switch (type) {
            case 'idFront': setIdFront(photo); break;
            case 'idBack':  setIdBack(photo);  break;
            case 'selfie':  setSelfie(photo);  break;
        }
    };

    const uploadedCount    = (idFront ? 1 : 0) + (idBack ? 1 : 0) + (selfie ? 1 : 0);
    const allPhotosUploaded = uploadedCount === 3;

    const handleSubmit = async () => {
        if (!userId) {
            Alert.alert('Error', 'Invalid user session. Please login again.');
            return;
        }

        if (!allPhotosUploaded) {
            Alert.alert('Missing Photos', 'Please upload all required photos.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('id_front', { uri: idFront.uri, name: 'id_front.jpg', type: 'image/jpeg' });
            formData.append('id_back',  { uri: idBack.uri,  name: 'id_back.jpg',  type: 'image/jpeg' });
            formData.append('selfie',   { uri: selfie.uri,  name: 'selfie.jpg',   type: 'image/jpeg' });

            const response = await fetch(API_ENDPOINTS.SUBMIT_STUDENT_VERIFICATION, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                Alert.alert('Error', 'Server returned invalid response');
                return;
            }

            if (data.status === 'success') {
                const updatedUser = { ...user, verification_status: 'pending' };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

                Alert.alert(
                    'Submitted Successfully!',
                    "Your verification is under review. You'll be notified within 24-48 hours.",
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to submit verification');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const PhotoUploadCard = ({ title, subtitle, icon, image, onPress, required = true }) => (
        <TouchableOpacity style={styles.uploadCard} onPress={onPress} activeOpacity={0.7}>
            {image ? (
                <View style={styles.imagePreview}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                    <View style={styles.imageOverlay}>
                        <TouchableOpacity style={styles.changeButton} onPress={onPress}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                            <Text style={styles.changeText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.checkmarkBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                </View>
            ) : (
                <View style={styles.uploadPlaceholder}>
                    <View style={styles.uploadIconContainer}>
                        <Ionicons name={icon} size={40} color="#E3B23C" />
                    </View>
                    <Text style={styles.uploadTitle}>{title}</Text>
                    <Text style={styles.uploadSubtitle}>{subtitle}</Text>
                    <View style={styles.uploadButton}>
                        <Ionicons name="camera" size={18} color="#000" />
                        <Text style={styles.uploadButtonText}>Upload Photo</Text>
                    </View>
                    {required && <Text style={styles.requiredText}>Required *</Text>}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Upload Documents</Text>
                    <Text style={styles.subtitle}>
                        Please upload clear photos of your student ID and a selfie
                    </Text>
                </View>

                <PhotoUploadCard
                    title="Student ID (Front)"
                    subtitle="Make sure all details are clearly visible"
                    icon="card-outline"
                    image={idFront}
                    onPress={() => showImageOptions('idFront')}
                />

                <PhotoUploadCard
                    title="Student ID (Back)"
                    subtitle="Ensure text and validity date are readable"
                    icon="card-outline"
                    image={idBack}
                    onPress={() => showImageOptions('idBack')}
                />

                <PhotoUploadCard
                    title="Selfie with Student ID"
                    subtitle="Hold your ID next to your face"
                    icon="person-circle-outline"
                    image={selfie}
                    onPress={() => takePhoto('selfie')}
                />

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(uploadedCount / 3) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{uploadedCount} of 3 photos uploaded</Text>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, (!allPhotosUploaded || loading) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!allPhotosUploaded || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Submit for Review</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#191919' },
    scrollContent:      { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
    header:             { marginBottom: 32 },
    title:              { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
    subtitle:           { fontSize: 16, color: '#9CA3AF', lineHeight: 24 },
    uploadCard:         { backgroundColor: '#2A2A2A', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#3A3A3A' },
    uploadPlaceholder:  { padding: 32, alignItems: 'center' },
    uploadIconContainer:{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1400', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    uploadTitle:        { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
    uploadSubtitle:     { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
    uploadButton:       { flexDirection: 'row', backgroundColor: '#E3B23C', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', gap: 8 },
    uploadButtonText:   { fontSize: 14, fontWeight: 'bold', color: '#000' },
    requiredText:       { fontSize: 12, color: '#EF4444', marginTop: 12 },
    imagePreview:       { position: 'relative', width: '100%', height: 240 },
    previewImage:       { width: '100%', height: '100%' },
    imageOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    changeButton:       { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', gap: 8 },
    changeText:         { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    checkmarkBadge:     { position: 'absolute', top: 16, right: 16, backgroundColor: '#191919', borderRadius: 20 },
    progressContainer:  { marginTop: 12, marginBottom: 24 },
    progressBar:        { height: 8, backgroundColor: '#3A3A3A', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill:       { height: '100%', backgroundColor: '#E3B23C', borderRadius: 4 },
    progressText:       { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    bottomContainer:    { backgroundColor: '#191919', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
    submitButton:       { flexDirection: 'row', backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText:   { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
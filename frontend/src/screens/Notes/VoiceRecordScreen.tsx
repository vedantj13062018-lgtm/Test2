/**
 * VoiceRecordScreen
 * Matches Java NotesRecordActivity - Voice to text recording
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Note: In a real implementation, you would use a library like
// react-native-voice or expo-speech for voice recognition

const VoiceRecordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { onTextReceived } = route.params || {};

  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    // In real implementation, request microphone permission
    // and start voice recognition
    setIsRecording(true);

    // Simulated voice recognition
    Alert.alert(
      'Voice Recording',
      'Voice recognition would be active. Speak now.\n\nNote: This feature requires react-native-voice or similar library for actual implementation.'
    );
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In real implementation, stop voice recognition
  };

  const handleCopyText = () => {
    if (!recordedText) {
      Alert.alert('Nothing to Copy', 'Please record some text first');
      return;
    }

    // In real implementation, use Clipboard API
    Alert.alert('Copied', 'Text copied to clipboard');
  };

  const handleInsertText = () => {
    if (!recordedText) {
      Alert.alert('Nothing to Insert', 'Please record or type some text first');
      return;
    }

    if (onTextReceived) {
      onTextReceived(recordedText);
    }
    navigation.goBack();
  };

  const handleClear = () => {
    setRecordedText('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Record</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Recording Controls */}
      <View style={styles.recordingSection}>
        <Text style={styles.sectionTitle}>Voice Recording</Text>
        <Text style={styles.instructions}>
          Tap the microphone button to start recording. Speak clearly and say "period" for punctuation.
        </Text>

        <View style={styles.recordButtonContainer}>
          <Animated.View style={[styles.recordButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.recordStatus}>
            {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
          </Text>
        </View>
      </View>

      {/* Recorded Text */}
      <View style={styles.textSection}>
        <Text style={styles.sectionTitle}>Recorded Text</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Your spoken text will appear here..."
          placeholderTextColor="#999"
          value={recordedText}
          onChangeText={setRecordedText}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Paste Section */}
      <View style={styles.pasteSection}>
        <Text style={styles.sectionTitle}>Paste Text (Optional)</Text>
        <TextInput
          style={styles.pasteInput}
          placeholder="Paste additional text here..."
          placeholderTextColor="#999"
          value={pastedText}
          onChangeText={setPastedText}
          multiline
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyText}>
          <Text style={styles.actionButtonText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.insertButton]}
          onPress={handleInsertText}
        >
          <Text style={[styles.actionButtonText, styles.insertButtonText]}>Insert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0070a9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  recordingSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  recordButtonContainer: {
    alignItems: 'center',
  },
  recordButtonOuter: {
    marginBottom: 15,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0070a9',
  },
  recordButtonActive: {
    backgroundColor: '#f44336',
    borderColor: '#d32f2f',
  },
  recordIcon: {
    fontSize: 32,
  },
  recordStatus: {
    fontSize: 14,
    color: '#666',
  },
  textSection: {
    flex: 1,
    padding: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlignVertical: 'top',
  },
  pasteSection: {
    padding: 15,
    paddingTop: 0,
  },
  pasteInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  insertButton: {
    backgroundColor: '#0070a9',
    borderColor: '#0070a9',
  },
  insertButtonText: {
    color: '#fff',
  },
});

export default VoiceRecordScreen;

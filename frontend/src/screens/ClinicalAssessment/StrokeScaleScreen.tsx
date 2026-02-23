/**
 * StrokeScaleScreen
 * Matches Java StrokeScaleActivity - Stroke/HEART score assessment
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface StrokeScaleOption {
  value: string;
  label: string;
  score: number;
}

interface StrokeScaleItem {
  id: string;
  question: string;
  options: StrokeScaleOption[];
  selected_value?: string;
  selected_score?: number;
}

interface ScaleData {
  total_score: string;
  stroke_scales: StrokeScaleItem[];
}

const SCALE_TYPES = [
  { id: 'stroke', label: 'Stroke Scale' },
  { id: 'heart', label: 'HEART Score' },
];

const StrokeScaleScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { encounterId } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [selectedScaleType, setSelectedScaleType] = useState('stroke');
  const [strokeData, setStrokeData] = useState<ScaleData | null>(null);
  const [heartData, setHeartData] = useState<ScaleData | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: { value: string; score: number } }>({});
  const [totalScore, setTotalScore] = useState(0);

  const fetchScaleData = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postNumr('ApiTiaTeleMD/fetchStrokeScaleScore', {
        encounter_id: encounterId || '',
        user_id: userId || '',
        session_id: sessionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;

        if (data?.stroke) {
          setStrokeData({
            total_score: data.stroke.totalScore || '0',
            stroke_scales: data.stroke.strokeScalesArray || [],
          });
        }

        if (data?.heart) {
          setHeartData({
            total_score: data.heart.totalScore || '0',
            stroke_scales: data.heart.strokeScalesArray || [],
          });
        }

        // Initialize with stroke data
        if (data?.stroke?.strokeScalesArray) {
          initializeAnswers(data.stroke.strokeScalesArray);
          setTotalScore(parseFloat(data.stroke.totalScore) || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching scale data:', error);
      Alert.alert('Error', 'Failed to load scale data');
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  useEffect(() => {
    fetchScaleData();
  }, []);

  const initializeAnswers = (items: StrokeScaleItem[]) => {
    const initialAnswers: { [key: string]: { value: string; score: number } } = {};
    items.forEach((item) => {
      if (item.selected_value) {
        initialAnswers[item.id] = {
          value: item.selected_value,
          score: item.selected_score || 0,
        };
      }
    });
    setAnswers(initialAnswers);
  };

  const handleScaleTypeChange = (scaleType: string) => {
    setSelectedScaleType(scaleType);

    if (scaleType === 'stroke' && strokeData) {
      initializeAnswers(strokeData.stroke_scales);
      setTotalScore(parseFloat(strokeData.total_score) || 0);
    } else if (scaleType === 'heart' && heartData) {
      initializeAnswers(heartData.stroke_scales);
      setTotalScore(parseFloat(heartData.total_score) || 0);
    }
  };

  const handleAnswerSelect = (itemId: string, option: StrokeScaleOption) => {
    const newAnswers = {
      ...answers,
      [itemId]: { value: option.value, score: option.score },
    };
    setAnswers(newAnswers);

    // Calculate new total score
    const newTotal = Object.values(newAnswers).reduce((sum, ans) => sum + ans.score, 0);
    setTotalScore(newTotal);
  };

  const getCurrentScaleItems = (): StrokeScaleItem[] => {
    if (selectedScaleType === 'stroke') {
      return strokeData?.stroke_scales || [];
    }
    return heartData?.stroke_scales || [];
  };

  const getScoreColor = (): string => {
    if (totalScore >= 15) return '#f44336';
    if (totalScore >= 10) return '#FF9800';
    if (totalScore >= 5) return '#FFC107';
    return '#4CAF50';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stroke Scale</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading scale data...</Text>
        </View>
      </View>
    );
  }

  const scaleItems = getCurrentScaleItems();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stroke Scale</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scale Type Selector */}
      <View style={styles.scaleTypeContainer}>
        {SCALE_TYPES.map((scale) => (
          <TouchableOpacity
            key={scale.id}
            style={[
              styles.scaleTypeButton,
              selectedScaleType === scale.id && styles.scaleTypeButtonActive,
            ]}
            onPress={() => handleScaleTypeChange(scale.id)}
          >
            <Text
              style={[
                styles.scaleTypeText,
                selectedScaleType === scale.id && styles.scaleTypeTextActive,
              ]}
            >
              {scale.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Total Score</Text>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor() }]}>
          <Text style={styles.scoreValue}>{totalScore}</Text>
        </View>
      </View>

      {/* Scale Items */}
      {scaleItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scale data available</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {scaleItems.map((item, index) => (
            <View key={item.id} style={styles.scaleItem}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>{index + 1}.</Text>
                <Text style={styles.questionText}>{item.question}</Text>
              </View>
              <View style={styles.optionsContainer}>
                {item.options.map((option) => {
                  const isSelected = answers[item.id]?.value === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                      onPress={() => handleAnswerSelect(item.id, option)}
                    >
                      <View style={styles.optionContent}>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {option.label}
                        </Text>
                      </View>
                      <View style={[styles.scorePill, isSelected && styles.scorePillSelected]}>
                        <Text style={[styles.scorePillText, isSelected && styles.scorePillTextSelected]}>
                          {option.score}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  scaleTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scaleTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  scaleTypeButtonActive: {
    backgroundColor: '#0070a9',
  },
  scaleTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scaleTypeTextActive: {
    color: '#fff',
  },
  scoreContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  scoreBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  scaleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070a9',
    marginRight: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: '#0070a9',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0070a9',
  },
  optionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#0070a9',
    fontWeight: '500',
  },
  scorePill: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  scorePillSelected: {
    backgroundColor: '#0070a9',
  },
  scorePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  scorePillTextSelected: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default StrokeScaleScreen;

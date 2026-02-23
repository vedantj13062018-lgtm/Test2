/**
 * Newsletter List Item Component
 * Replicated from StrokeTeamOne NewsLetterAdapter
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Newsletter } from '../types';

interface NewsletterListItemProps {
  newsletter: Newsletter;
  index: number;
  onViewPress?: (newsletter: Newsletter) => void;
}

const NewsletterListItem: React.FC<NewsletterListItemProps> = ({
  newsletter,
  index,
  onViewPress,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      // Convert from yyyy-MM-dd to MM-dd-yyyy (matching Java Utils.convertDateFromUTC)
      // For date-only strings, we can do a simple string conversion
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        // Validate that we have valid date parts
        if (year.length === 4 && month.length === 2 && day.length === 2) {
          return `${month}-${day}-${year}`;
        }
      }
      // Fallback: try parsing as Date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
      }
      return dateString;
    } catch (error) {
      console.error('[NewsletterListItem] Error formatting date:', error);
      return dateString;
    }
  };

  const handleViewPress = () => {
    if (onViewPress && newsletter.file_url) {
      onViewPress(newsletter);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.contentContainer}>
          {/* Number */}
          <Text style={styles.numberText}>{index + 1}.</Text>
          
          {/* Text Content */}
          <View style={styles.textContainer}>
            {/* Title */}
            <View style={styles.row}>
              <Text style={styles.labelText}>Title : </Text>
              <Text style={styles.valueText} numberOfLines={1} ellipsizeMode="tail">
                {newsletter.label || ''}
              </Text>
            </View>
            
            {/* Start Date */}
            <View style={styles.row}>
              <Text style={styles.labelText}>Start Date : </Text>
              <Text style={styles.valueText}>
                {formatDate(newsletter.start_date)}
              </Text>
            </View>
            
            {/* End Date */}
            <View style={styles.row}>
              <Text style={styles.labelText}>End Date : </Text>
              <Text style={styles.valueText}>
                {formatDate(newsletter.end_date)}
              </Text>
            </View>
          </View>
          
          {/* Eye Icon */}
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={handleViewPress}
            disabled={!newsletter.file_url}
          >
            <Text style={styles.eyeIcon}>👁</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberText: {
    width: 50,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  textContainer: {
    flex: 1,
    marginRight: 30,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
    marginTop: 5,
  },
  labelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  valueText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    flex: 1,
  },
  eyeIconContainer: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#000000',
  },
});

export default NewsletterListItem;

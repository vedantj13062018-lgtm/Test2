/**
 * File Share List Item Component
 * Replicated from FetchshareImagesAdapter.java and list_item_file_share.xml
 * Icons from StrokeTeamOne: img_share, img_download, group_g (delete), group_k (placeholder), ic_pdf
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { FileShare } from '../types';

interface FileShareListItemProps {
  file: FileShare;
  index: number;
  isSharedByMe?: boolean;
  onDelete?: (file: FileShare) => void;
  onShare?: (file: FileShare) => void;
  onDownload?: (file: FileShare) => void;
  onView?: (file: FileShare) => void;
}

const FileShareListItem: React.FC<FileShareListItemProps> = ({
  file,
  index,
  isSharedByMe = false,
  onDelete,
  onShare,
  onDownload,
  onView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  /** Match Android Utils.convertDateFromTimezone → MM-dd-yyyy (e.g. 02-25-2025) */
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    return size;
  };

  const getFileExtension = () => {
    const ext = file.fileextension || file.file_extension || '';
    return ext.toLowerCase();
  };

  const isPdf = () => {
    return getFileExtension() === 'pdf';
  };

  const handleItemPress = () => {
    setIsExpanded(!isExpanded);
  };

  /** Show "No Permission" toast like StrokeTeamOne when file cannot be opened */
  const showNoPermissionToast = () => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show('No Permission', ToastAndroid.SHORT);
    } else {
      Alert.alert('No Permission', '');
    }
  };

  const handleViewPress = () => {
    if (onView) {
      onView(file);
    } else if (file.filepath || file.file_path) {
      const url = file.filepath || file.file_path || '';
      if (isPdf()) {
        Linking.openURL(url).catch((err) => {
          console.error('Error opening PDF:', err);
          showNoPermissionToast();
        });
      }
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(file);
            }
          },
        },
      ]
    );
  };

  const handleSharePress = () => {
    if (onShare) {
      onShare(file);
    }
  };

  const handleDownloadPress = () => {
    if (onDownload) {
      onDownload(file);
    }
  };

  const filePath = file.filepath || file.file_path || '';
  const fileName = file.filename || file.file_name || 'Unknown';
  const fileType = file.filetype || file.file_type || '';
  const fileExtension = getFileExtension();
  const fileSize = formatFileSize(file.filesize || file.file_size);
  const uploadedDate = formatDate(file.uploadeddate || file.uploaded_date || file.shared_time);
  const patientName = file.patientname || file.patient_name || '';
  const mrn = file.mrn || '';
  const shareBy = file.shareby || file.share_by || '';
  const sharedFrom = formatDate(file.sharedfrom || file.shared_from);
  const sharedTill = formatDate(file.sharedtill || file.shared_till);
  const showDownload = file.downloadbtnvisible === 1 || file.download_btn_visible === 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        {/* Top row: icon + content + action icons - match list_item_file_share.xml */}
        <View style={styles.mainContent}>
          {/* File Icon - 70x80, red PDF or image - match Android image_share; tap PDF to open */}
          <View style={styles.iconContainer}>
            {isPdf() ? (
              <TouchableOpacity
                style={styles.pdfIconWrap}
                onPress={handleViewPress}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../assets/images/icon_pdf.png')}
                  style={styles.pdfIcon}
                  resizeMode="stretch"
                />
              </TouchableOpacity>
            ) : filePath ? (
              <Image
                source={{ uri: filePath }}
                style={styles.fileImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../assets/images/icon_file_placeholder.png')}
                style={styles.fileImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Center: collapsed summary OR expanded details - match Android listdata / selecteddata */}
          <View style={styles.fileInfo}>
            {isExpanded ? (
              /* Expanded: Patient name, Date of upload, File name, MRN, File type (order from Android) */
              <View style={styles.expandedDetails}>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>Patient name:</Text>
                  <Text style={styles.detailValue13}>{patientName || ''}</Text>
                </View>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>Date of upload:</Text>
                  <Text style={styles.detailValue13}>{uploadedDate}</Text>
                </View>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>File name:</Text>
                  <Text style={styles.detailValue13} numberOfLines={1}>{fileName}</Text>
                </View>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>MRN:</Text>
                  <Text style={styles.detailValue13}>{mrn || ''}</Text>
                </View>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>File type:</Text>
                  <Text style={styles.detailValue13}>{fileType || ''}</Text>
                </View>
              </View>
            ) : (
              /* Collapsed: filename bold caps, file type, extension+size+date, MRN */
              <>
                <Text style={styles.fileName} numberOfLines={1}>
                  {fileName.toUpperCase()}
                </Text>
                {fileType ? (
                  <Text style={styles.fileType}>{fileType}</Text>
                ) : null}
                <Text style={styles.fileDetails}>
                  {fileExtension ? `${fileExtension}, ` : ''}
                  {fileSize ? `${fileSize} ` : ''}
                  {uploadedDate}
                </Text>
                <View style={styles.detailRowInline}>
                  <Text style={styles.detailLabel13}>MRN:</Text>
                  <Text style={styles.detailValue13}>{mrn || ''}</Text>
                </View>
              </>
            )}
          </View>

          {/* Right: action icons - collapsed: only delete; expanded: download (if visible) + delete - match layoutActions */}
          <View style={styles.actionIconsColumn}>
            {isExpanded && showDownload && (
              <TouchableOpacity style={styles.iconButton} onPress={handleDownloadPress}>
                <Image source={require('../../assets/images/img_download.png')} style={styles.actionIcon} resizeMode="contain" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={handleDeletePress}>
              <Image source={require('../../assets/images/icon_delete_file.png')} style={styles.actionIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Divider + Shared by - only when expanded, match Android view + infolayout */}
      {isExpanded && (
        <>
          <View style={styles.divider} />
          <View style={styles.sharedByRow}>
            <Text style={styles.sharebyhead}>Shared by:</Text>
            <Text style={styles.txtsharedwith}>{shareBy || ''}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  itemContainer: {
    padding: 10,
    paddingBottom: 5,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 7,
  },
  pdfIconWrap: {
    width: 70,
    height: 80,
    borderRadius: 3,
    backgroundColor: '#C84A4A',
    overflow: 'hidden',
  },
  pdfIcon: {
    width: 70,
    height: 80,
    borderRadius: 3,
  },
  fileImage: {
    width: 70,
    height: 80,
    borderRadius: 3,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  expandedDetails: {
    marginLeft: 7,
  },
  detailRowInline: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'center',
  },
  detailLabel13: {
    fontSize: 13,
    color: '#000000',
    fontFamily: 'Montserrat',
    marginRight: 4,
  },
  detailValue13: {
    fontSize: 13,
    color: '#000000',
    fontFamily: 'Montserrat',
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    marginLeft: 7,
    fontFamily: 'Montserrat',
  },
  fileType: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 2,
    marginLeft: 7,
    fontFamily: 'Montserrat',
  },
  fileDetails: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 2,
    marginLeft: 7,
    fontFamily: 'Montserrat',
  },
  actionIconsColumn: {
    alignItems: 'center',
    marginLeft: 4,
  },
  iconButton: {
    padding: 4,
    marginVertical: 2,
  },
  deleteButton: {
    marginTop: 12,
  },
  actionIcon: {
    width: 30,
    height: 30,
  },
  divider: {
    height: 1,
    backgroundColor: '#9b9b9b',
    marginHorizontal: 10,
    marginVertical: 8,
  },
  sharedByRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 0,
    alignItems: 'center',
  },
  sharebyhead: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Montserrat',
    marginRight: 4,
  },
  txtsharedwith: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
});

export default FileShareListItem;

/**
 * File Share Screen
 * Replicated from FileShareActivity.java and activity_file_share.xml
 * Upload options from dialog_choose_upload_location.xml
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Image,
  Linking,
  Share,
  ToastAndroid,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { types as DocTypes, isCancel as isDocPickerCancel } from 'react-native-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import FileShareListItem from '../../components/FileShareListItem';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { FileShare } from '../../types';
import CustomDrawer from '../../components/CustomDrawer';
import { SESSION_ID, USER_ID } from '../../constants';

export type PendingUploadFile = { uri: string; name?: string; type?: string };

/** Per-file metadata for Upload Details modal – match Android Images model */
export type UploadDetailMeta = {
  patient_id?: string;
  patientName?: string;
  mrn?: string;
  notes?: string;
  fileTypeId?: string;
};

type TabType = 'sharedByMe' | 'sharedWithMe';

type GroupOption = { id: string; name: string };
type ShareUserOption = { id: string; name: string };

const FileShareScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('sharedWithMe');
  const [sharedByMeFiles, setSharedByMeFiles] = useState<FileShare[]>([]);
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<PendingUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterUploadDate, setFilterUploadDate] = useState('');
  const [filterSharedFrom, setFilterSharedFrom] = useState('');
  const [filterSharedTill, setFilterSharedTill] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  const [filterShareBy, setFilterShareBy] = useState('');
  const [filterShareTo, setFilterShareTo] = useState('');
  const [filterFileName, setFilterFileName] = useState('');
  const [filterPatientName, setFilterPatientName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fileTypesList, setFileTypesList] = useState<FileShare[]>([]);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  // Upload Details modal – match Android uplodDescriptionBottomNavigation / layout_file_share_item_details
  const [uploadDetailsVisible, setUploadDetailsVisible] = useState(false);
  const [uploadDetailsIndex, setUploadDetailsIndex] = useState(0);
  const [uploadDetails, setUploadDetails] = useState<UploadDetailMeta[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [shareUserIds, setShareUserIds] = useState<string[]>([]);
  const [shareUsers, setShareUsers] = useState<ShareUserOption[]>([]);
  const [groupId, setGroupId] = useState('');
  const [groupsList, setGroupsList] = useState<GroupOption[]>([]);
  const [uploadDetailsFileTypes, setUploadDetailsFileTypes] = useState<FileShare[]>([]);
  const [doctorsList, setDoctorsList] = useState<ShareUserOption[]>([]);
  const [shareSearchText, setShareSearchText] = useState('');
  const [shareDropdownVisible, setShareDropdownVisible] = useState(false);
  const [uploadDetailsTypeDropdown, setUploadDetailsTypeDropdown] = useState(false);
  const [uploadDetailsGroupDropdown, setUploadDetailsGroupDropdown] = useState(false);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  /** Match Android convertToJsonData() - server expects all keys (e.g. upload_date) to exist; use filter form + search */
  const convertFiltersToJson = (): string => {
    const filters: Record<string, string> = {
      upload_date: filterUploadDate.trim(),
      share_from_date: filterSharedFrom.trim(),
      share_to_date: filterSharedTill.trim(),
      file_type: filterFileType.trim(),
      file_name: filterFileName.trim() || searchText.trim() || '',
      patient_name: filterPatientName.trim(),
      patient_mrn: '',
      share_by: filterShareBy.trim(),
      share_to: filterShareTo.trim(),
    };
    return JSON.stringify(filters);
  };

  const loadSharedByMeFiles = async (isScrolling: boolean = false) => {
    try {
      if (isScrolling) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      
      if (!sessionId || !userId || sessionId === '' || userId === '') {
        console.warn('[FileShareScreen] Missing session data');
        setSharedByMeFiles([]);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const filtersJson = convertFiltersToJson();
      const currentLength = sharedByMeFiles.length;
      const start = isScrolling ? currentLength.toString() : '0';
      
      const response = await apiService.getAllFilesList({
        filters: filtersJson,
        start,
        limit: '10',
        get_share_by_users: '0',
      });

      const isSuccess = response && (response.code === 200 || response.code === '200' || response.status === 'success') && response.data;
      if (isSuccess) {
        const files = response.data.myfilesdata || response.data.my_files_data || [];
        const count = response.data.countofmyfiles ?? response.data.count_of_my_files ?? 0;
        
        if (isScrolling) {
          setSharedByMeFiles((prev) => [...prev, ...files]);
        } else {
          setSharedByMeFiles(files);
        }
        setTotalCount(count);
      } else {
        const serverError = response && typeof response === 'object' && (response as any).code;
        const is404 = serverError === 404 || serverError === '404';
        const rawMsg = response && typeof response === 'object' && ((response as any).message || (response as any).status);
        const errorMsg =
          (is404 ? 'Files list is not available on this server. The feature may not be enabled.' : null) ||
          rawMsg ||
          'Unable to load files. Please check your connection and that the server URL is correct.';
        console.error('[FileShareScreen] API returned error:', errorMsg);
        if (!isScrolling) {
          Alert.alert('Error', errorMsg);
        }
        if (!isScrolling) {
          setSharedByMeFiles([]);
        }
      }
    } catch (error: any) {
      console.error('[FileShareScreen] Error loading shared by me files:', error);
      if (!isScrolling) {
        let errorMessage = 'Failed to load files';
        if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
        setSharedByMeFiles([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadSharedWithMeFiles = async (isScrolling: boolean = false) => {
    try {
      if (isScrolling) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      
      if (!sessionId || !userId || sessionId === '' || userId === '') {
        console.warn('[FileShareScreen] Missing session data');
        setSharedWithMeFiles([]);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const filtersJson = convertFiltersToJson();
      const currentLength = sharedWithMeFiles.length;
      const start = isScrolling ? currentLength.toString() : '0';
      
      const response = await apiService.getAllFilesList({
        filters: filtersJson,
        start,
        limit: '10',
        get_share_by_users: '1',
      });

      const isSuccess = response && (response.code === 200 || response.code === '200' || response.status === 'success') && response.data;
      if (isSuccess) {
        const files = response.data.sharedwith || response.data.shared_with || response.data.allfiles || response.data.all_files || [];
        const count = response.data.countofsharedwith ?? response.data.count_of_shared_with ?? 0;
        
        if (isScrolling) {
          setSharedWithMeFiles((prev) => [...prev, ...files]);
        } else {
          setSharedWithMeFiles(files);
        }
        setTotalCount(count);
      } else {
        const serverError = response && typeof response === 'object' && (response as any).code;
        const is404 = serverError === 404 || serverError === '404';
        const rawMsg = response && typeof response === 'object' && ((response as any).message || (response as any).status);
        const errorMsg =
          (is404 ? 'Files list is not available on this server. The feature may not be enabled.' : null) ||
          rawMsg ||
          'Unable to load files. Please check your connection and that the server URL is correct.';
        console.error('[FileShareScreen] API returned error:', errorMsg);
        if (!isScrolling) {
          Alert.alert('Error', errorMsg);
        }
        if (!isScrolling) {
          setSharedWithMeFiles([]);
        }
      }
    } catch (error: any) {
      console.error('[FileShareScreen] Error loading shared with me files:', error);
      if (!isScrolling) {
        let errorMessage = 'Failed to load files';
        if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
        setSharedWithMeFiles([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadFiles = (isScrolling: boolean = false) => {
    if (activeTab === 'sharedByMe') {
      loadSharedByMeFiles(isScrolling);
    } else {
      loadSharedWithMeFiles(isScrolling);
    }
  };

  useEffect(() => {
    // Reset files when tab changes
    if (activeTab === 'sharedByMe') {
      setSharedByMeFiles([]);
    } else {
      setSharedWithMeFiles([]);
    }
    loadFiles(false);
  }, [activeTab]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      // Reset files when search changes
      if (activeTab === 'sharedByMe') {
        setSharedByMeFiles([]);
      } else {
        setSharedWithMeFiles([]);
      }
      loadFiles(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadFiles(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])
  );

  const handleDelete = async (file: FileShare) => {
    try {
      if (!file.fileid && !file.file_id) {
        Alert.alert('Error', 'File ID not available');
        return;
      }

      const fileId = String(file.fileid ?? file.file_id ?? '');
      const response = await apiService.deleteUploadFiles(fileId);

      const isSuccess = response && (response.code === 200 || response.code === '200' || response.status === 'success');
      if (isSuccess) {
        Alert.alert('Success', 'File deleted successfully');
        loadFiles(false);
      } else {
        Alert.alert('Error', (response && (response.message || response.status)) || 'Failed to delete file');
      }
    } catch (error: any) {
      console.error('[FileShareScreen] Error deleting file:', error);
      Alert.alert('Error', error?.message || 'Failed to delete file');
    }
  };

  const handleShare = (file: FileShare) => {
    const url = file.filepath || file.file_path || '';
    const fileName = file.filename || file.file_name || 'file';
    if (!url) {
      Alert.alert('Error', 'File URL not available');
      return;
    }
    Share.share({
      url: Platform.OS === 'ios' ? url : url,
      message: `${fileName}\n${url}`,
      title: 'Share file',
    }).catch((err) => {
      if (err.message && !err.message.includes('User did not share')) {
        Alert.alert('Error', 'Share failed');
      }
    });
  };

  /** Match StrokeTeamOne: single action on Download tap; show "No Permission" toast like Android app when cannot open */
  const showNoPermissionToast = () => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show('No Permission', ToastAndroid.SHORT);
    } else {
      Alert.alert('No Permission', '');
    }
  };

  /** Match StrokeTeamOne: open file URL in external viewer. Do not use canOpenURL for http/https - it often returns false and causes "No Permission". */
  const handleDownload = async (file: FileShare) => {
    const url = (file.filepath || file.file_path || '').trim();
    if (!url) {
      showNoPermissionToast();
      return;
    }
    try {
      const supported = url.startsWith('http://') || url.startsWith('https://');
      if (supported) {
        await Linking.openURL(url);
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          showNoPermissionToast();
          return;
        }
        await Linking.openURL(url);
      }
    } catch (error: any) {
      showNoPermissionToast();
    }
  };

  const handleView = (file: FileShare) => {
    const filePath = file.filepath || file.file_path || '';
    if (filePath) {
      // Open PDF or file in external viewer
      // This will be handled by the FileShareListItem component
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchText('');
  };

  /** Match StrokeTeamOne: show upload options bottom sheet (dialog_choose_upload_location) */
  const handleUploadPress = () => {
    setUploadModalVisible(true);
  };

  const closeUploadModal = () => {
    setUploadModalVisible(false);
  };

  /** Match Android: after picking files open Upload Details modal immediately (uploadDialogue → uplodDescriptionBottomNavigation) */
  const openUploadDetailsModal = (files: PendingUploadFile[]) => {
    setUploadModalVisible(false);
    setUploadDetailsIndex(0);
    setPendingUploadFiles((prev) => {
      const next = [...prev, ...files];
      setUploadDetails((d) => [...d, ...files.map(() => ({}))]);
      setApplyToAll(next.length > 1);
      return next;
    });
    setUploadDetailsVisible(true);
    apiService.fetchFileTypes().then((res) => {
      const ok = res && (res.code === 200 || res.code === '200') && res.data;
      if (ok && res.data) {
        const types = res.data.filetypes || res.data.file_types || [];
        setUploadDetailsFileTypes(Array.isArray(types) ? types : []);
      }
    }).catch(() => setUploadDetailsFileTypes([]));
    apiService.fetchGroupsList().then((res) => {
      const ok = res && (res.code === 200 || res.code === '200') && res.data;
      if (ok && res.data) {
        const list = (res.data as any).group_list || (res.data as any).groupList || [];
        setGroupsList(Array.isArray(list) ? list.map((g: any) => ({ id: g.id || g.groupid || '', name: g.name || '' })) : []);
      }
    }).catch(() => setGroupsList([]));
    apiService.getAllDoctorsLists().then((res) => {
      const ok = res && (res.code === 200 || res.code === '200') && res.data;
      if (ok && res.data) {
        const list = (res.data as any).doctor_list || (res.data as any).doctors || [];
        setDoctorsList(Array.isArray(list) ? list.map((d: any) => ({ id: String(d.id ?? d.user_id ?? ''), name: d.name ?? d.doctor_name ?? '' })) : []);
      }
    }).catch(() => setDoctorsList([]));
  };

  /** Take a photo – match layout_camera → CamaraImageViewActivity; we use launchCamera. After pick open Upload Details modal. */
  const handleTakePhoto = async () => {
    closeUploadModal();
    try {
      const result = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
      if (result.didCancel || !result.assets?.length) return;
      const assets = result.assets;
      const files: PendingUploadFile[] = assets.map((a) => ({
        uri: a.uri ?? a.originalPath ?? '',
        name: a.fileName ?? (a.uri ? a.uri.split('/').pop() : undefined),
        type: a.type ?? 'image/jpeg',
      })).filter((f) => f.uri);
      if (files.length) openUploadDetailsModal(files);
    } catch (e: any) {
      console.error('[FileShareScreen] launchCamera error:', e);
      Alert.alert('Error', e?.message ?? 'Could not open camera');
    }
  };

  /** Choose from device – match layout_internal_storage → ACTION_GET_CONTENT image/*, multiple. After pick open Upload Details modal. */
  const handleChooseFromDevice = async () => {
    closeUploadModal();
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0,
        includeBase64: false,
      });
      if (result.didCancel || !result.assets?.length) return;
      const files: PendingUploadFile[] = result.assets.map((a) => ({
        uri: a.uri ?? a.originalPath ?? '',
        name: a.fileName ?? (a.uri ? a.uri.split('/').pop() : undefined),
        type: a.type ?? 'image/jpeg',
      })).filter((f) => f.uri);
      if (files.length) openUploadDetailsModal(files);
    } catch (e: any) {
      console.error('[FileShareScreen] launchImageLibrary error:', e);
      Alert.alert('Error', e?.message ?? 'Could not open gallery');
    }
  };

  /** Scan PDF Document – match layout_scan_document → DocumentScannerCameraXActivity; we use camera. After pick open Upload Details modal. */
  const handleScanDocument = async () => {
    closeUploadModal();
    try {
      const result = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
      if (result.didCancel || !result.assets?.length) return;
      const assets = result.assets;
      const files: PendingUploadFile[] = assets.map((a) => ({
        uri: a.uri ?? a.originalPath ?? '',
        name: a.fileName ?? (a.uri ? a.uri.split('/').pop() : undefined),
        type: a.type ?? 'image/jpeg',
      })).filter((f) => f.uri);
      if (files.length) openUploadDetailsModal(files);
    } catch (e: any) {
      console.error('[FileShareScreen] scan document (camera) error:', e);
      Alert.alert('Error', e?.message ?? 'Could not open camera for scan');
    }
  };

  /** Sync current form into uploadDetails[uploadDetailsIndex] (call before changing index or saving) */
  const syncCurrentUploadDetails = (patch: Partial<UploadDetailMeta>) => {
    setUploadDetails((prev) => {
      const next = [...prev];
      next[uploadDetailsIndex] = { ...next[uploadDetailsIndex], ...patch };
      return next;
    });
  };

  /** Match Android savedata() → uploadFilesDoc. Build file_details from pendingUploadFiles + uploadDetails, then upload. */
  const handleSaveUploadDetails = async () => {
    if (pendingUploadFiles.length === 0) return;
    setUploading(true);
    let details = [...uploadDetails];
    if (applyToAll && details.length > 0) {
      const currentDetails = details[uploadDetailsIndex] ?? {};
      details = pendingUploadFiles.map(() => ({ ...currentDetails }));
    }
    const fileDetails = pendingUploadFiles.map((f, i) => {
      const d = details[i] ?? {};
      const fileName = f.name || f.uri.split('/').pop() || 'file';
      return {
        file_name: fileName,
        file_type: d.fileTypeId ?? '',
        patient_id: d.patient_id ?? '',
        image_notes: d.notes ?? '',
      };
    });
    const shareUsersJson = JSON.stringify(shareUserIds);
    if (!groupId && shareUserIds.length === 0) {
      Alert.alert(
        'Continue without sharing?',
        'Continue uploading without sharing files with users?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setUploading(false) },
          { text: 'Continue', onPress: () => doUploadWithParams(fileDetails, shareUsersJson) },
        ]
      );
      return;
    }
    doUploadWithParams(fileDetails, shareUsersJson);
  };

  const doUploadWithParams = async (
    fileDetails: Array<{ file_name: string; file_type: string | number; patient_id: string | number; image_notes: string }>,
    shareUsersJson: string
  ) => {
    try {
      const response = await apiService.uploadFilesDocWithFiles(pendingUploadFiles, {
        fileDetails,
        apply_to_all: applyToAll ? '1' : '0',
        group_id: groupId,
        share_users: shareUsersJson,
      }) as { code?: number | string; status?: string; message?: string; data?: { code?: number | string; status?: string; message?: string } };
      const code = response?.code ?? response?.data?.code;
      const status = response?.status ?? response?.data?.status;
      const ok = response && (code === 200 || code === '200' || status === 'success');
      const msg = response?.message ?? (response?.data && typeof response.data === 'object' ? (response.data as { message?: string }).message : undefined) ?? 'Upload successful';
      if (ok) {
        setPendingUploadFiles([]);
        setUploadDetails([]);
        setUploadDetailsVisible(false);
        setShareUserIds([]);
        setShareUsers([]);
        setGroupId('');
        if (Platform.OS === 'android' && ToastAndroid) {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Alert.alert('Upload', msg);
        }
        loadSharedByMeFiles();
        loadSharedWithMeFiles();
      } else {
        const errMsg = (response && (response.message || (typeof response.data === 'object' && response.data?.message) || response.status)) || 'Upload failed';
        Alert.alert('Upload failed', errMsg);
      }
    } catch (e: any) {
      console.error('[FileShareScreen] upload error:', e);
      let errMsg = e?.message ?? 'Upload failed';
      if (e?.response?.data != null) {
        if (typeof e.response.data === 'string') errMsg = e.response.data;
        else if (e.response.data?.message) errMsg = e.response.data.message;
      }
      Alert.alert('Upload failed', errMsg);
    } finally {
      setUploading(false);
    }
  };

  /** Choose Document – match layout_choose_document → openDocumentPicker. After pick open Upload Details modal. */
  const handleChooseDocument = async () => {
    closeUploadModal();
    try {
      const results = await DocumentPicker.pick({
        allowMultiSelection: true,
        type: [
          DocTypes.pdf,
          DocTypes.doc,
          DocTypes.docx,
          DocTypes.xls,
          DocTypes.xlsx,
          DocTypes.ppt,
          DocTypes.pptx,
          DocTypes.plainText,
        ],
        copyTo: 'cachesDirectory',
      });
      if (!results?.length) return;
      const files: PendingUploadFile[] = results.map((r) => ({
        uri: r.fileCopyUri ?? r.uri,
        name: r.name ?? undefined,
        type: r.type ?? undefined,
      })).filter((f) => f.uri);
      if (files.length) openUploadDetailsModal(files);
    } catch (e: any) {
      if (isDocPickerCancel(e)) return;
      console.error('[FileShareScreen] document picker error:', e);
      Alert.alert('Error', e?.message ?? 'Could not open document picker');
    }
  };

  const currentFiles = activeTab === 'sharedByMe' ? sharedByMeFiles : sharedWithMeFiles;
  const itemCount = currentFiles.length;

  const renderFileItem = ({ item, index }: { item: FileShare; index: number }) => {
    return (
      <FileShareListItem
        file={item}
        index={index}
        isSharedByMe={activeTab === 'sharedByMe'}
        onDelete={handleDelete}
        onShare={handleShare}
        onDownload={handleDownload}
        onView={handleView}
      />
    );
  };

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.emptyText}>Loading files...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No files available</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0070a9" />
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && currentFiles.length < totalCount) {
      loadFiles(true);
    }
  };

  const showFilesSelectedToast = (message: string) => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Files selected', message, [{ text: 'OK' }]);
    }
  };

  /** Format date as MM-dd-yyyy to match Android Utils.convertDateFromTimezone */
  const formatFilterDate = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const onDatePickerChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setFilterUploadDate(formatFilterDate(selectedDate));
  };

  /** Match StrokeTeamOne: tool_filter in header right – opens filter dialog; fetch file types like fetchfiletype() */
  const openFilterModal = () => {
    setFilterFileName(searchText);
    setFilterModalVisible(true);
    setTypeDropdownVisible(false);
    ApiService.fetchFileTypes()
      .then((res) => {
        const ok = res && (res.code === 200 || res.code === '200') && res.data;
        if (ok && res.data) {
          const types = res.data.filetypes || res.data.file_types || [];
          setFileTypesList(Array.isArray(types) ? types : []);
        }
      })
      .catch(() => setFileTypesList([]));
  };
  const closeFilterModal = () => {
    setFilterModalVisible(false);
    setTypeDropdownVisible(false);
    setShowDatePicker(false);
  };

  const handleFilterApply = () => {
    setSearchText(filterFileName);
    closeFilterModal();
    loadSharedByMeFiles();
    loadSharedWithMeFiles();
  };

  const handleFilterReset = () => {
    setFilterUploadDate('');
    setFilterSharedFrom('');
    setFilterSharedTill('');
    setFilterFileType('');
    setFilterShareBy('');
    setFilterShareTo('');
    setFilterFileName('');
    setFilterPatientName('');
    setSearchText('');
    closeFilterModal();
    loadSharedByMeFiles();
    loadSharedWithMeFiles();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <CustomDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
      
      {/* Header with Gradient - no marginTop so header starts at top like NewsletterScreen/DirectoryScreen */}
      <View style={styles.headerContainer}>
        {/* Left Drawer Icon Section - Dark Blue */}
        <TouchableOpacity 
          style={styles.drawerIconContainer}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/images/side_bar_icon.png')}
            style={styles.drawerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerGradientContainer}>
          <View style={styles.gradientHeader}>
            <Svg
              style={StyleSheet.absoluteFill}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <Defs>
                <SvgLinearGradient id="fileShareHeaderGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#00006e" />
                  <Stop offset="0.5" stopColor="#0070a9" />
                  <Stop offset="1" stopColor="#007eb6" />
                </SvgLinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#fileShareHeaderGrad)" />
            </Svg>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your files</Text>
              </View>
              <TouchableOpacity
                style={styles.headerFilterButton}
                onPress={openFilterModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.headerFilterIcon}>≡</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sharedByMe' && styles.activeTab,
          ]}
          onPress={() => handleTabChange('sharedByMe')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sharedByMe' && styles.activeTabText,
            ]}
          >
            Shared by me
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sharedWithMe' && styles.activeTab,
          ]}
          onPress={() => handleTabChange('sharedWithMe')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sharedWithMe' && styles.activeTabText,
            ]}
          >
            Shared with me
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999999"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Recently Uploaded Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently uploaded</Text>
          <Text style={styles.itemCount}>{itemCount} items</Text>
        </View>

        <FlatList
          data={currentFiles}
          renderItem={renderFileItem}
          keyExtractor={(item, index) => String(item.fileid ?? item.file_id ?? `file-${index}`)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <Text style={styles.uploadIcon}>↑</Text>
        <Text style={styles.uploadButtonText}>Upload file(s)</Text>
      </TouchableOpacity>

      {/* Upload options modal – match dialog_choose_upload_location.xml */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeUploadModal}
      >
        <TouchableOpacity
          style={styles.uploadModalOverlay}
          activeOpacity={1}
          onPress={closeUploadModal}
        >
          <View style={styles.uploadModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.uploadModalHeader}>
              <TouchableOpacity onPress={closeUploadModal} style={styles.uploadModalBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.uploadModalBackArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.uploadModalTitle}>Upload file(s)</Text>
            </View>
            <ScrollView style={styles.uploadOptionsList} showsVerticalScrollIndicator={false}>
              {pendingUploadFiles.length > 0 && (
                <TouchableOpacity
                  style={[styles.uploadOptionRow, styles.uploadOptionRowHighlight]}
                  onPress={() => {
                    setUploadDetailsIndex(0);
                    setUploadDetails((prev) => {
                      const n = pendingUploadFiles.length;
                      if (prev.length >= n) return prev.slice(0, n);
                      return [...prev, ...Array(n - prev.length).fill({})];
                    });
                    setUploadDetailsVisible(true);
                    apiService.fetchFileTypes().then((res) => {
                      if (res?.data) {
                        const types = res.data.filetypes || res.data.file_types || [];
                        setUploadDetailsFileTypes(Array.isArray(types) ? types : []);
                      }
                    });
                    apiService.fetchGroupsList().then((res) => {
                      if (res?.data) {
                        const list = (res.data as any).group_list || (res.data as any).groupList || [];
                        setGroupsList(Array.isArray(list) ? list.map((g: any) => ({ id: g.id || g.groupid || '', name: g.name || '' })) : []);
                      }
                    });
                    apiService.getAllDoctorsLists().then((res) => {
                      if (res?.data) {
                        const list = (res.data as any).doctor_list || (res.data as any).doctors || [];
                        setDoctorsList(Array.isArray(list) ? list.map((d: any) => ({ id: String(d.id ?? d.user_id ?? ''), name: d.name ?? d.doctor_name ?? '' })) : []);
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadOptionIcon}>📤</Text>
                  <Text style={styles.uploadOptionText}>
                    {`Upload ${pendingUploadFiles.length} selected file(s)`}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.uploadOptionRow} onPress={handleTakePhoto} activeOpacity={0.7}>
                <Text style={styles.uploadOptionIcon}>📷</Text>
                <Text style={styles.uploadOptionText}>Take a photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOptionRow} onPress={handleChooseFromDevice} activeOpacity={0.7}>
                <Text style={styles.uploadOptionIcon}>🖼️</Text>
                <Text style={styles.uploadOptionText}>Choose from device</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOptionRow} onPress={handleScanDocument} activeOpacity={0.7}>
                <Text style={styles.uploadOptionIcon}>📄</Text>
                <Text style={styles.uploadOptionText}>Scan PDF Document</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOptionRow} onPress={handleChooseDocument} activeOpacity={0.7}>
                <Text style={styles.uploadOptionIcon}>📎</Text>
                <Text style={styles.uploadOptionText}>Choose Document</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Upload Details modal – full height so Share To User + SAVE are never clipped */}
      <Modal visible={uploadDetailsVisible} transparent animationType="slide" onRequestClose={() => setUploadDetailsVisible(false)}>
        <View style={styles.uploadDetailsOverlay}>
          <KeyboardAvoidingView
            style={styles.uploadDetailsKeyboardWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={styles.uploadDetailsContainer} onStartShouldSetResponder={() => true}>
              {/* File Details header bar – teal, "File Details" left, back + nav 1/N right */}
              <View style={styles.uploadDetailsHeaderBar}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Exit the files upload screen?', '', [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => { setUploadDetailsVisible(false); setPendingUploadFiles([]); setUploadDetails([]); setShareUsers([]); setShareUserIds([]); setGroupId(''); } },
                  ]);
                }}
                style={styles.uploadDetailsBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.uploadDetailsHeaderText}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.uploadDetailsHeaderTitle, { flex: 1 }]}>File Details</Text>
              <View style={styles.uploadDetailsNav}>
                <TouchableOpacity
                  onPress={() => {
                    if (uploadDetailsIndex <= 0) return;
                    setUploadDetailsIndex((i) => i - 1);
                    setUploadDetailsTypeDropdown(false);
                    setUploadDetailsGroupDropdown(false);
                  }}
                  style={styles.uploadDetailsNavBtn}
                  disabled={uploadDetailsIndex <= 0}
                >
                  <Text style={[styles.uploadDetailsHeaderText, uploadDetailsIndex <= 0 && { opacity: 0.4 }]}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.uploadDetailsHeaderText}>  {uploadDetailsIndex + 1}/{pendingUploadFiles.length}  </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (uploadDetailsIndex >= pendingUploadFiles.length - 1) return;
                    setUploadDetailsIndex((i) => i + 1);
                    setUploadDetailsTypeDropdown(false);
                    setUploadDetailsGroupDropdown(false);
                  }}
                  style={styles.uploadDetailsNavBtn}
                  disabled={uploadDetailsIndex >= pendingUploadFiles.length - 1}
                >
                  <Text style={[styles.uploadDetailsHeaderText, uploadDetailsIndex >= pendingUploadFiles.length - 1 && { opacity: 0.4 }]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.uploadDetailsScroll} contentContainerStyle={styles.uploadDetailsScrollContent} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              {/* File Details card – white */}
              <View style={styles.uploadDetailsCard}>
                <View style={styles.uploadDetailsFileNameRow}>
                  <Text style={styles.uploadDetailsFileName} numberOfLines={1}>
                    {pendingUploadFiles[uploadDetailsIndex]?.name || pendingUploadFiles[uploadDetailsIndex]?.uri?.split('/').pop() || 'File'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (pendingUploadFiles.length === 1) {
                        setPendingUploadFiles([]);
                        setUploadDetails([]);
                        setUploadDetailsVisible(false);
                      } else {
                        setPendingUploadFiles((prev) => prev.filter((_, i) => i !== uploadDetailsIndex));
                        setUploadDetails((prev) => prev.filter((_, i) => i !== uploadDetailsIndex));
                        setUploadDetailsIndex((i) => (i >= pendingUploadFiles.length - 1 ? i - 1 : i));
                      }
                    }}
                    style={styles.uploadDetailsDeleteBtn}
                  >
                    <Text style={styles.uploadDetailsDeleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.uploadDetailsLabel, { marginTop: 0 }]}>File Type*</Text>
                <TouchableOpacity
                  style={[styles.uploadDetailsDropdown, uploadDetailsTypeDropdown && styles.uploadDetailsDropdownOpen]}
                  onPress={() => { setUploadDetailsTypeDropdown(!uploadDetailsTypeDropdown); setUploadDetailsGroupDropdown(false); }}
                >
                  <Text style={styles.uploadDetailsDropdownText} numberOfLines={1}>
                    {(() => {
                      const fid = uploadDetails[uploadDetailsIndex]?.fileTypeId ?? '';
                      const ft = uploadDetailsFileTypes.find((t) => String((t as { id?: string }).id ?? '') === fid);
                      return (ft?.filetype || ft?.file_type) || 'Select';
                    })()}
                  </Text>
                  <Text style={styles.uploadDetailsChevron}>▼</Text>
                </TouchableOpacity>
                {uploadDetailsTypeDropdown && (
                  <View style={styles.uploadDetailsDropdownList}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                      <TouchableOpacity style={styles.typeDropdownItem} onPress={() => { syncCurrentUploadDetails({ fileTypeId: '' }); setUploadDetailsTypeDropdown(false); }}>
                        <Text style={styles.typeDropdownItemText}>Select</Text>
                      </TouchableOpacity>
                      {uploadDetailsFileTypes.map((t) => (
                        <TouchableOpacity key={String((t as { id?: string }).id ?? '')} style={styles.typeDropdownItem} onPress={() => { syncCurrentUploadDetails({ fileTypeId: String((t as { id?: string }).id ?? '') }); setUploadDetailsTypeDropdown(false); }}>
                          <Text style={styles.typeDropdownItemText}>{t.filetype || t.file_type || ''}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={styles.uploadDetailsLabel}>Remarks</Text>
                <TextInput
                  style={styles.uploadDetailsRemarksInput}
                  placeholder="Non mandatory file notes"
                  placeholderTextColor="#999"
                  value={uploadDetails[uploadDetailsIndex]?.notes ?? ''}
                  onChangeText={(text) => syncCurrentUploadDetails({ notes: text })}
                  multiline
                />
                <Text style={styles.uploadDetailsLabel}>Patient Name</Text>
                <TextInput
                  style={styles.uploadDetailsInput}
                  placeholder="Patient Name"
                  placeholderTextColor="#999"
                  value={uploadDetails[uploadDetailsIndex]?.patientName ?? ''}
                  onChangeText={(text) => syncCurrentUploadDetails({ patientName: text })}
                />
                <Text style={styles.uploadDetailsLabel}>MRN</Text>
                <TextInput
                  style={styles.uploadDetailsInput}
                  placeholder="MRN"
                  placeholderTextColor="#999"
                  value={uploadDetails[uploadDetailsIndex]?.mrn ?? ''}
                  onChangeText={(text) => syncCurrentUploadDetails({ mrn: text })}
                />
                {pendingUploadFiles.length > 1 && (
                  <TouchableOpacity style={styles.uploadDetailsApplyRow} onPress={() => setApplyToAll(!applyToAll)} activeOpacity={0.7}>
                    <View style={[styles.uploadDetailsCheckbox, applyToAll && styles.uploadDetailsCheckboxChecked]}>
                      {applyToAll && <Text style={styles.uploadDetailsCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.uploadDetailsApplyLabel}>Apply To All Files</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* File Share Details header bar – teal */}
              <View style={styles.uploadDetailsSectionHeader}>
                <Text style={styles.uploadDetailsHeaderTitle}>File Share Details</Text>
              </View>
              {/* File Share Details card – white */}
              <View style={styles.uploadDetailsCard}>
                <Text style={[styles.uploadDetailsLabel, { marginTop: 0 }]}>Share To Group</Text>
                <TouchableOpacity
                  style={[styles.uploadDetailsDropdown, uploadDetailsGroupDropdown && styles.uploadDetailsDropdownOpen]}
                  onPress={() => { setUploadDetailsGroupDropdown(!uploadDetailsGroupDropdown); setUploadDetailsTypeDropdown(false); }}
                >
                  <Text style={styles.uploadDetailsDropdownText} numberOfLines={1}>
                    {groupsList.find((g) => g.id === groupId)?.name || 'Select'}
                  </Text>
                  <Text style={styles.uploadDetailsChevron}>▼</Text>
                </TouchableOpacity>
                {uploadDetailsGroupDropdown && (
                  <View style={styles.uploadDetailsDropdownList}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                      <TouchableOpacity style={styles.typeDropdownItem} onPress={() => { setGroupId(''); setUploadDetailsGroupDropdown(false); }}>
                        <Text style={styles.typeDropdownItemText}>Select</Text>
                      </TouchableOpacity>
                      {groupsList.map((g) => (
                        <TouchableOpacity key={g.id} style={styles.typeDropdownItem} onPress={() => { setGroupId(g.id); setUploadDetailsGroupDropdown(false); }}>
                          <Text style={styles.typeDropdownItemText}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={styles.uploadDetailsLabel}>Share To User</Text>
                <TextInput
                  style={styles.uploadDetailsInput}
                  placeholder="Search user"
                  placeholderTextColor="#999"
                  value={shareSearchText}
                  onChangeText={(t) => { setShareSearchText(t); setShareDropdownVisible(true); }}
                  onFocus={() => setShareDropdownVisible(true)}
                />
                {shareDropdownVisible && doctorsList.length > 0 && (
                  <View style={[styles.uploadDetailsDropdownList, { maxHeight: 120 }]}>
                    {doctorsList.filter((d) => d.name.toLowerCase().includes(shareSearchText.toLowerCase()) && !shareUsers.some((s) => s.id === d.id)).slice(0, 8).map((d) => (
                      <TouchableOpacity key={d.id} style={styles.typeDropdownItem} onPress={() => { setShareUsers((prev) => [...prev, d]); setShareUserIds((prev) => [...prev, d.id]); setShareSearchText(''); setShareDropdownVisible(false); }}>
                        <Text style={styles.typeDropdownItemText}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {shareUsers.length > 0 && (
                  <View style={styles.uploadDetailsChips}>
                    {shareUsers.map((u) => (
                      <TouchableOpacity key={u.id} style={styles.uploadDetailsChip} onPress={() => { setShareUsers((prev) => prev.filter((x) => x.id !== u.id)); setShareUserIds((prev) => prev.filter((id) => id !== u.id)); }}>
                        <Text style={styles.uploadDetailsChipText}>{u.name}</Text>
                        <Text style={styles.uploadDetailsChipX}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
              {/* Save button – full width, teal, always visible at bottom with safe area */}
              <View style={styles.uploadDetailsSaveWrap}>
                <TouchableOpacity style={styles.uploadDetailsSaveButton} onPress={handleSaveUploadDetails} disabled={uploading} activeOpacity={0.8}>
                  <Text style={styles.uploadDetailsSaveText}>{uploading ? 'Uploading...' : 'SAVE'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Filter modal – match screenshot: Filters title, Date of upload + calendar, Type dropdown, Shared by, File name, Patient name, Reset/Apply teal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.filterModalOverlay} activeOpacity={1} onPress={closeFilterModal}>
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.filterModalHeader}>
              <TouchableOpacity onPress={closeFilterModal} style={styles.filterModalBack}>
                <Text style={styles.filterModalBackArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.filterModalTitle}>Filters</Text>
            </View>
            <ScrollView style={styles.filterForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Date of upload</Text>
              <TouchableOpacity
                style={styles.filterInputRow}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <TextInput
                  style={styles.filterInputWithIcon}
                  placeholder="mm-dd-yyyy"
                  placeholderTextColor="#999"
                  value={filterUploadDate}
                  onChangeText={setFilterUploadDate}
                  editable={false}
                  pointerEvents="none"
                />
                <TouchableOpacity style={styles.filterCalendarIcon} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.filterCalendarIconText}>📅</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={
                    filterUploadDate
                      ? (() => {
                          const parts = filterUploadDate.split('-').map(Number);
                          if (parts.length === 3) return new Date(parts[2], parts[0] - 1, parts[1]);
                          return new Date();
                        })()
                      : new Date()
                  }
                  mode="date"
                  display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                  onChange={onDatePickerChange}
                />
              )}
              <Text style={styles.filterLabel}>Type</Text>
              <View style={styles.filterTypeDropdownWrap}>
                <TouchableOpacity
                  style={[styles.filterTypeDropdown, typeDropdownVisible && styles.filterTypeDropdownOpen]}
                  onPress={() => setTypeDropdownVisible(!typeDropdownVisible)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterTypeDropdownText} numberOfLines={1}>
                    {filterFileType || 'All'}
                  </Text>
                  <Text style={[styles.filterTypeChevron, typeDropdownVisible && styles.filterTypeChevronOpen]}>▼</Text>
                </TouchableOpacity>
                {/* Inline dropdown list – appears directly below the Type field */}
                {typeDropdownVisible && (
                  <View style={styles.typeDropdownList}>
                    <ScrollView
                      style={styles.typeDropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {['All', ...fileTypesList.map((t) => t.filetype || t.file_type || '').filter(Boolean)].map(
                        (item) => (
                          <TouchableOpacity
                            key={`type-${item}`}
                            style={[
                              styles.typeDropdownItem,
                              (filterFileType || 'All') === item && styles.typeDropdownItemSelected,
                            ]}
                            onPress={() => {
                              setFilterFileType(item === 'All' ? '' : item);
                              setTypeDropdownVisible(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.typeDropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              <Text style={styles.filterLabel}>Shared by</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Shared by"
                placeholderTextColor="#999"
                value={filterShareBy}
                onChangeText={setFilterShareBy}
              />
              <Text style={styles.filterLabel}>File name</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="File Name"
                placeholderTextColor="#999"
                value={filterFileName}
                onChangeText={setFilterFileName}
              />
              <Text style={styles.filterLabel}>Patient name</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Patient Name"
                placeholderTextColor="#999"
                value={filterPatientName}
                onChangeText={setFilterPatientName}
              />
              <View style={styles.filterButtons}>
                <TouchableOpacity style={styles.filterResetButton} onPress={handleFilterReset}>
                  <Text style={styles.filterResetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterApplyButton} onPress={handleFilterApply}>
                  <Text style={styles.filterApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    width: '100%',
  },
  drawerIconContainer: {
    width: 65,
    height: '100%',
    backgroundColor: '#00006e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  drawerIcon: {
    width: 40,
    height: 40,
  },
  headerGradientContainer: {
    flex: 1,
  },
  gradientHeader: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerFilterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerFilterIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    marginLeft: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 13,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#0070a9',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    paddingVertical: 0,
  },
  searchIconContainer: {
    padding: 5,
  },
  searchIcon: {
    fontSize: 18,
    color: '#999999',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  itemCount: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    fontFamily: 'Montserrat',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00006e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 13,
    marginBottom: 5,
    borderRadius: 4,
  },
  uploadIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    marginRight: 10,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  // Upload options modal – match dialog_choose_upload_location.xml
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  uploadModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 10,
    marginBottom: 30,
    paddingBottom: 20,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  uploadModalBack: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalBackArrow: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  uploadModalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 5,
    fontFamily: 'Montserrat',
  },
  uploadOptionsList: {
    paddingHorizontal: 10,
  },
  uploadOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#F4F4F4',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 4,
    paddingLeft: 20,
  },
  uploadOptionIcon: {
    fontSize: 28,
    marginRight: 6,
  },
  uploadOptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  uploadOptionRowHighlight: {
    backgroundColor: '#E3F2FD',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginTop: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterModalBack: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalBackArrow: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  filterModalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 5,
    fontFamily: 'Montserrat',
  },
  filterForm: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  filterLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  filterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  filterInputWithIcon: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  filterCalendarIcon: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCalendarIconText: {
    fontSize: 20,
  },
  filterTypeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  filterTypeDropdownText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Montserrat',
    flex: 1,
  },
  filterTypeChevron: {
    fontSize: 10,
    color: '#0070a9',
    marginLeft: 8,
  },
  filterTypeChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  filterTypeDropdownWrap: {
    marginBottom: 4,
  },
  filterTypeDropdownOpen: {
    borderColor: '#0070a9',
    borderWidth: 1.5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  typeDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0070a9',
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    maxHeight: 220,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  typeDropdownScroll: {
    maxHeight: 218,
  },
  typeDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  typeDropdownItemSelected: {
    backgroundColor: '#E8F4FC',
  },
  filterButtons: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 20,
    gap: 10,
  },
  filterResetButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  filterResetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  filterApplyButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  filterApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  typeDropdownItemText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  // Upload Details modal – match screenshot; ensure SAVE + Share To User are never clipped
  uploadDetailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  uploadDetailsKeyboardWrap: {
    width: '100%',
    height: '90%',
  },
  uploadDetailsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  uploadDetailsHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#00a2b8',
    paddingHorizontal: 12,
  },
  uploadDetailsBackBtn: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  uploadDetailsHeaderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadDetailsHeaderTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  uploadDetailsNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadDetailsNavBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDetailsScroll: {
    flex: 1,
  },
  uploadDetailsScrollContent: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 24,
    flexGrow: 1,
  },
  uploadDetailsCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 0,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  uploadDetailsFileNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 8,
  },
  uploadDetailsFileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  uploadDetailsDeleteBtn: {
    padding: 4,
  },
  uploadDetailsDeleteIcon: {
    fontSize: 20,
    color: '#C62828',
  },
  uploadDetailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 15,
    marginBottom: 6,
  },
  uploadDetailsDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  uploadDetailsDropdownOpen: {
    borderColor: '#00a2b8',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  uploadDetailsDropdownText: {
    fontSize: 15,
    color: '#000000',
    flex: 1,
  },
  uploadDetailsChevron: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 8,
  },
  uploadDetailsDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    maxHeight: 220,
    zIndex: 1000,
    ...Platform.select({
      android: { elevation: 8 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    }),
  },
  uploadDetailsRemarksInput: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  uploadDetailsInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  uploadDetailsApplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  uploadDetailsCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDetailsCheckboxChecked: {
    backgroundColor: '#00a2b8',
    borderColor: '#00a2b8',
  },
  uploadDetailsCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadDetailsApplyLabel: {
    fontSize: 15,
    color: '#000000',
  },
  uploadDetailsSectionHeader: {
    height: 40,
    backgroundColor: '#00a2b8',
    marginTop: 14,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  uploadDetailsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  uploadDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  uploadDetailsChipText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 4,
  },
  uploadDetailsChipX: {
    fontSize: 16,
    color: '#666666',
  },
  uploadDetailsSaveWrap: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  uploadDetailsSaveButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#00a2b8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  uploadDetailsSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default FileShareScreen;

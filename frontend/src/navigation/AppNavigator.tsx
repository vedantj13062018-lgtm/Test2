/**
 * Main App Navigator
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { getStringFromStorage } from '../utils/storage';
import { SESSION_ID } from '../constants';
import { RootStackParamList } from '../types';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import MFAScreen from '../screens/Auth/MFAScreen';
import OrganizationSelectionScreen from '../screens/Auth/OrganizationSelectionScreen';
import MainTabsNavigator from './MainTabsNavigator';
import VideoCallScreen from '../screens/VideoCall/VideoCallScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import InboxDetailsScreen from '../screens/Inbox/InboxDetailsScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import NewsletterScreen from '../screens/NewsletterScreen';
import SupportFeedbackScreen from '../screens/SupportFeedbackScreen';
import HelpScreen from '../screens/HelpScreen';
import FileShareScreen from '../screens/FileShare/FileShareScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import ConferenceCallScreen from '../screens/ConferenceCall/ConferenceCallScreen';
import JoinWithMeetingIDScreen from '../screens/ConferenceCall/JoinWithMeetingIDScreen';
import CallLogsScreen from '../screens/CallLogs/CallLogsScreen';
import { navigationRef } from './navigationRef';

// Investigations Module
import InvestigationsListScreen from '../screens/Investigations/InvestigationsListScreen';
import InvestigationTypesScreen from '../screens/Investigations/InvestigationTypesScreen';
import RadiologyStudyListScreen from '../screens/Investigations/RadiologyStudyListScreen';
import DicomSeriesViewerScreen from '../screens/Investigations/DicomSeriesViewerScreen';
import InvestigationResultScreen from '../screens/Investigations/InvestigationResultScreen';
import LabResultUploadScreen from '../screens/Investigations/LabResultUploadScreen';

// Task Module
import TaskListScreen from '../screens/Tasks/TaskListScreen';
import TaskEscalationScreen from '../screens/Tasks/TaskEscalationScreen';
import TaskDetailsScreen from '../screens/Tasks/TaskDetailsScreen';
import TaskCommentsScreen from '../screens/Tasks/TaskCommentsScreen';
import TaskFilterScreen from '../screens/Tasks/TaskFilterScreen';

// ICU Module
import ICUListScreen from '../screens/ICU/ICUListScreen';
import ICURoomTypesScreen from '../screens/ICU/ICURoomTypesScreen';
import ICUPatientDetailsScreen from '../screens/ICU/ICUPatientDetailsScreen';
import ICURemarksScreen from '../screens/ICU/ICURemarksScreen';
import ICUCameraControlScreen from '../screens/ICU/ICUCameraControlScreen';
import WaveformDisplayScreen from '../screens/ICU/WaveformDisplayScreen';
import ICUAlertScreen from '../screens/ICU/ICUAlertScreen';

// Clinical Assessment Module
import ClinicalAssessmentScreen from '../screens/ClinicalAssessment/ClinicalAssessmentScreen';
import AssessmentHistoryScreen from '../screens/ClinicalAssessment/AssessmentHistoryScreen';
import FormCategoriesScreen from '../screens/ClinicalAssessment/FormCategoriesScreen';
import FormItemsScreen from '../screens/ClinicalAssessment/FormItemsScreen';
import StrokeScaleScreen from '../screens/ClinicalAssessment/StrokeScaleScreen';
import ICDCPTScreen from '../screens/ClinicalAssessment/ICDCPTScreen';
import FavouriteICDCPTScreen from '../screens/ClinicalAssessment/FavouriteICDCPTScreen';

// Notes Module
import PatientNotesScreen from '../screens/Notes/PatientNotesScreen';
import NoteTypesScreen from '../screens/Notes/NoteTypesScreen';
import NotesEditorScreen from '../screens/Notes/NotesEditorScreen';
import VoiceRecordScreen from '../screens/Notes/VoiceRecordScreen';
import NotesWebViewScreen from '../screens/Notes/NotesWebViewScreen';

// Medications Module
import MedicationsLabOrdersScreen from '../screens/Medications/MedicationsLabOrdersScreen';
import AddPrescriptionScreen from '../screens/Medications/AddPrescriptionScreen';
import UploadPrescriptionScreen from '../screens/Medications/UploadPrescriptionScreen';
import SearchMedicinesScreen from '../screens/Medications/SearchMedicinesScreen';
import FrequencyRouteListScreen from '../screens/Medications/FrequencyRouteListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isRestoring, setIsRestoring] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<'Splash' | 'MainTabs'>('Splash');

  useEffect(() => {
    // Restore session on app start - only run once
    const restore = async () => {
      try {
        const storedSessionId = await getStringFromStorage(SESSION_ID);
        if (storedSessionId) {
          setInitialRouteName('MainTabs');
        } else {
          setInitialRouteName('Splash');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        setInitialRouteName('Splash');
      } finally {
        setIsRestoring(false);
      }
    };
    restore();
  }, []); // Empty dependency array - only run once on mount

  // Show nothing while restoring session to prevent double render
  if (isRestoring) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        initialRouteName={initialRouteName}
      >
        {/* Always register all screens to prevent re-mounting when state changes */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MFA" component={MFAScreen} />
        <Stack.Screen name="OrganizationSelection" component={OrganizationSelectionScreen} />
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="JitsiMeeting"
          component={require('../screens/VideoCall/JitsiMeetingScreen').default}
          options={{ presentation: 'fullScreenModal', animation: 'fade', headerShown: false }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="InboxDetails" component={InboxDetailsScreen} />
        <Stack.Screen name="Directory" component={DirectoryScreen} />
        <Stack.Screen name="Newsletters" component={NewsletterScreen} />
        <Stack.Screen name="SupportFeedback" component={SupportFeedbackScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="CallLogs" component={CallLogsScreen} />
        <Stack.Screen name="FileShare" component={FileShareScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
        <Stack.Screen name="ConferenceCall" component={ConferenceCallScreen} />
        <Stack.Screen name="JoinWithMeetingID" component={JoinWithMeetingIDScreen} />

        {/* Investigations Module */}
        <Stack.Screen name="InvestigationsList" component={InvestigationsListScreen} />
        <Stack.Screen name="InvestigationTypes" component={InvestigationTypesScreen} />
        <Stack.Screen name="RadiologyStudyList" component={RadiologyStudyListScreen} />
        <Stack.Screen name="DicomSeriesViewer" component={DicomSeriesViewerScreen} />
        <Stack.Screen name="InvestigationResult" component={InvestigationResultScreen} />
        <Stack.Screen name="LabResultUpload" component={LabResultUploadScreen} />

        {/* Task Module */}
        <Stack.Screen name="TaskList" component={TaskListScreen} />
        <Stack.Screen name="TaskEscalation" component={TaskEscalationScreen} />
        <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
        <Stack.Screen name="TaskComments" component={TaskCommentsScreen} />
        <Stack.Screen name="TaskFilter" component={TaskFilterScreen} />

        {/* ICU Module */}
        <Stack.Screen name="ICUList" component={ICUListScreen} />
        <Stack.Screen name="ICURoomTypes" component={ICURoomTypesScreen} />
        <Stack.Screen name="ICUPatientDetails" component={ICUPatientDetailsScreen} />
        <Stack.Screen name="ICURemarks" component={ICURemarksScreen} />
        <Stack.Screen name="ICUCameraControl" component={ICUCameraControlScreen} />
        <Stack.Screen name="WaveformDisplay" component={WaveformDisplayScreen} />
        <Stack.Screen name="ICUAlert" component={ICUAlertScreen} />

        {/* Clinical Assessment Module */}
        <Stack.Screen name="ClinicalAssessment" component={ClinicalAssessmentScreen} />
        <Stack.Screen name="AssessmentHistory" component={AssessmentHistoryScreen} />
        <Stack.Screen name="FormCategories" component={FormCategoriesScreen} />
        <Stack.Screen name="FormItems" component={FormItemsScreen} />
        <Stack.Screen name="StrokeScale" component={StrokeScaleScreen} />
        <Stack.Screen name="ICDCPT" component={ICDCPTScreen} />
        <Stack.Screen name="FavouriteICDCPT" component={FavouriteICDCPTScreen} />

        {/* Notes Module */}
        <Stack.Screen name="PatientNotes" component={PatientNotesScreen} />
        <Stack.Screen name="NoteTypes" component={NoteTypesScreen} />
        <Stack.Screen name="NotesEditor" component={NotesEditorScreen} />
        <Stack.Screen name="VoiceRecord" component={VoiceRecordScreen} />
        <Stack.Screen name="NotesWebView" component={NotesWebViewScreen} />

        {/* Medications Module */}
        <Stack.Screen name="MedicationsLabOrders" component={MedicationsLabOrdersScreen} />
        <Stack.Screen name="AddPrescription" component={AddPrescriptionScreen} />
        <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
        <Stack.Screen name="SearchMedicines" component={SearchMedicinesScreen} />
        <Stack.Screen name="FrequencyRouteList" component={FrequencyRouteListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

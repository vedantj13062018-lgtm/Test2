/**
 * Application Constants
 * Matches Swift Constant.swift
 */

// App Info
export const APP_NAME = 'TiaTele MD';
export const LOGIN_USER_TYPE = 'Doctor';
export const APP_LOGO = 'TeleMD Logo';

// Storage Keys
export const USER_ID = 'userID';
export const USER_TYPE = 'userType';
export const IS_LOGGED_IN = 'isLoggedIn';
export const SESSION_ID = 'session_id';
export const USER_NAME = 'user_name';
export const CHAT_USER_NAME = 'chat_user_name';
export const DOCTOR_NAME = 'doctor_name';
export const SPECIALITY_ID = 'speciality_id';
export const ORGANIZATION_ID = 'organization_Id';
export const ORGANIZATION_NAME = 'organization_Name';
export const ORGANIZATION_COUNT = 'organization_count';
export const PRACTICE_LOC_ID = 'practice_loc_id';
export const PRACTICE_LOC_NAME = 'practice_loc_name';
export const USER_PROFILE_IMAGE = 'user_profile_image';
export const APP_CODE = 'appCode';
export const IS_APIAPPCHECK_IN = 'isApiAppCheckIn';
export const BASE_URL = 'BASE_URL';
export const BASE_SOCKET_URL = 'BASE_SOCKET_URL';
export const SERVER_URL = 'server_url';

// Default URL values (matches Swift Constant.swift)
// These are the default values from Swift, but will be overridden by values from app code API
export const DEFAULT_BASE_URL = 'http://192.168.1.250:2017/api/';
export const DEFAULT_BASE_SOCKET_URL = 'http://192.168.1.250:2017/';
export const MEDIA_URL = 'https://practicetiatechpacs.tiamd.com/media/';
export const GROUP_CALL_URL = 'apiGroupCallURL';
export const TURN_USERNAME = 'turnUsername';
export const TURN_PASSWORD = 'turnPassword';
export const TURN = 'turn';
export const SPEAK_TO_EXEC_ENABLED = 'isSpeakToExecEnabled';
export const EXECUTIVE_MOBILE_NO = 'executiveMobileNo';
export const IS_FILE_SHARE_ENABLED = 'isFileShareEnabled';
export const CALL_BLOCK_TYPE = 'callBlockType';
export const IS_INBOX_ENABLED = 'isInboxEnabled';
export const IS_APPOINTMENT_ENABLED = 'isAppointmentEnabled';

// Call Types
export const EMERGENCY_CALL = 'Emergency';
export const GROUP_CALL = 'GroupCall';
export const GROUP_CALL_END = 'GroupCallEnd';
export const DIRECT_CALL = 'DirectCall';
export const APPOINTMENT_CALL = 'AppointmentCall';
export const CALL_LOG_CALL = 'CallLogCall';
export const GROUP_CALL_ENABLE = 'Groupcall_Status';

// Messages
export const NO_INTERNET = 'No internet connection';
export const CALL_DROPPED = 'Call ended by participant';
export const CALL_REJECTED = 'Call rejected by participant';
export const PATIENT_SHARE_MESSAGE = 'wants to share patient information\n\nPatient name:';
export const SUPPORT_MESSAGE = 'Failed to fetch support details';
export const DELETE_INBOX_THREAD_MESSAGE = 'Are you sure you want to delete the entire message thread?';
export const DELETE_INBOX_INDIVIDAL_MESSAGE = 'Are you sure you want to delete this message?';
export const MARK_ALL_AS_READ_MESSAGE = 'Are you sure you want to mark all as read?';
export const DELETE_ALERT_MESSAGE = 'Are you sure you want to delete this alert message?';
export const CANCEL_REQUEST_MESSAGE = 'Are you sure you want to cancel this request?';
export const DELETE_ENCOUNTER_MESSAGE = 'You are deleting an encounter already sent for billing. This patient will be marked as Unseen on the Rounding list. Proceed?';
export const EXIT_GROUP_CHAT_MESSAGE = 'Do you wish to exit the group permanently?';
export const USER_REMOVED_MESSAGE = "You can't send messages to this group because you're no longer a participant";
export const MFA_CODE_VALIDATION_MESSAGE = 'Please enter verification code';
export const EXIT_FILESHARE = 'Exit the files upload screen?';

// Inbox Types
export const INBOX_TYPE_INBOX = 'inbox';
export const INBOX_TYPE_SENT = 'sent';

// History Array
export const HISTORY_ARRAY = [
  'CHIEF COMPLAINTS',
  'VITALS',
  'ORDERS',
  'MEDICATIONS',
  'UPLOADED DOCUMENTS',
  'STETH READING',
  'STROKE SCALES',
  'INTAKE',
];

// Toast Length
export const SHORT = 1;
export const MEDIUM = 2;
export const LONG = 4;

// Server Messages
export const SERVER_CALL_FAILED = 'Server call failed';
export const SERVER_NOT_RESPONDING = 'Server not responding';

// MIME Types
export const MIME_IMAGE = 'image/jpeg';
export const MIME_MOV = 'MOV';
export const MIME_MP3 = 'mp3/mpeg';
export const MIME_DOC = 'pdf/doc';
export const MIME_PDF = 'application/pdf';

// Date Formats
export const FORMAT_UTC_LONG = 'UTC';
export const MM_DD_YYYY_HH_MM_Z = 'MM/dd/yyyy, h:mm a';
export const MM_DD_YYYY_HH_MM = 'MM-dd-yyyy h:mm a';
export const MM_DD_YYYY_HH_MM_SS = 'MM-dd-yyyy HH:mm:ss';
export const MMM_DD_YYYY_h_mm_a = 'MMM dd yyyy h:mm a';
export const yyyy_MM_dd_HH_MM_SS = 'yyyy-MM-dd HH:mm:ss';
export const yyyy_MM_dd_HH_MM = 'yyyy-MM-dd HH:mm';
export const MM_DD_YYYY = 'MM-dd-yyyy';
export const YYYYMMDD = 'yyyyMMdd';
export const YYYY_MM_DD = 'yyyy-MM-dd';
export const MMM_DD_YYYY = 'MMM dd yyyy';
export const MM_DD_YYYY_h_mm_a = 'MM-dd-yyyy h:mm a';
export const YYYY_MM_DD_T_HH_MM_SS_Z = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
export const YYYY_MM_DD_T_HH_MM_SSZ = "yyyy-MM-dd'T'HH:mm:ssZ";
export const HH_mm_A = 'h:mm a';
export const HH_MM_SS = 'H:mm:ss';
export const HH_MM = 'H:mm';
export const DD_MM_YYYY_HH_MM_AA = 'dd-MM-yyyy hh:mm a';
export const MMM_DD = 'MMM dd';
export const DD_MMM_YYYY_H_MM_A = 'dd MMM yyyy, h:mm a';
export const DD_MM_YYYY_HH_MM_A = 'dd/MM/yyyy hh:mm a';
export const DD_MMM_YYYY = 'dd MMM yyyy';
export const DD_MM_YYYY = 'dd-MM-yyyy';

// User Types
export const DOCTOR = 'DOCTOR';
export const CART = 'CART';
export const PATIENT = 'PATIENT';
export const MISSED_CALL = 'missed';

// API Endpoints
export const API_APPCHECK = 'appCheck';
export const LOGIN_URL = 'login';
export const LOGOUT_URL = 'logout';
export const CHANGE_PASSWORD = 'passwordChangeRequest';
export const FORGOT_PASSWORD = 'forgotPassword';

// Patient & Encounter APIs
export const FETCH_PATIENT_VISIT = 'fetchPatientVisits';
export const FETCH_ENCOUNTER_HISTORY = 'fetchEncounterHistory';
export const API_GET_ENCOUNTER = 'getEncounter';
export const API_FETCH_ENCOUNTER_HISTORY = 'ApiTiaTeleMD/fetchPatientEncounterHistory';
export const API_FETCH_ECNOUNTER_LIST = 'ApiTiaTeleMD/fetchPatientEncountersList';
export const API_SAVE_NEW_VISIT_ENCOUNTER = 'ApiTiaTeleMD/saveNewVisitEncounter';
export const API_DELETE_ENCOUNTER = 'ApiTiaTeleMD/deleteRoundingEncounter';

// Clinical Assessment APIs
export const FETCH_STROKE_SCALE_QUESTIONS = 'strokeScaleInstructions';
export const SAVE_STROKE_SCORE = 'saveStrokeScores';
export const API_FETCH_STROKE_SCORE = 'fetchStrokeScore';
export const API_FETCH_CLINICAL_ASSES_HISTORY = 'fetchClinicalAssessmentHistory';
export const API_FETCH_ASSESSMENT_HISTORY = 'ApiTiaTeleMD/fetchPatientAssesmentHistory';
export const GET_FORM_CATEGORY = 'getFormCategories';
export const GET_FORM_TEMPLATES = 'getFormTemplates';
export const FETCH_FORM_ITEMS = 'fetchFormItems';
export const SAVE_FORM_DATA = 'saveFormData';
export const GET_FORM_CATEGORY_API = 'apimobile/getFormCategories';
export const GET_FORM_TEMPLATES_API = 'apimobile/getFormTemplates';
export const FETCH_FORM_ITEMS_API = 'apimobile/fetchFormItems';
export const SAVE_FORM_DATA_API = 'apimobile/saveFormData';
export const FAVOURITE_UNFAVOURITE_API = 'apimobile/favoriteAndUnfavorite';
export const FETCH_SCALE_TYPE = 'fetchScaleTypes';
export const API_FETCH_FORM_CATEGORY = 'ApiTiaTeleMD/fetchFormCategory';
export const API_FETCH_FORM_DETAILS = 'ApiTiaTeleMD/fetchFormDetails';
export const API_SAVE_FORM_DATA = 'ApiTiaTeleMD/saveFormData';
export const API_FETCH_FORM_PDF = 'ApiTiaTeleMD/printClincalAssesment';

// Notes APIs
export const API_FETCH_PATIENT_NOTES_TYPE = 'ApiTiaTeleMD/fetchPatientNotetypes';
export const API_FETCH_PATIENT_NOTE = 'ApiTiaTeleMD/fetchPatientNotes';
export const FETCH_NOTES_HEADER = 'ApiTiaTeleMD/getNotesHederOrder';
export const FETCH_NOTES_HEADER_TEXT = 'ApiTiaTeleMD/getNotesHederText';
export const API_SAVE_NOTES = 'ApiTiaTeleMD/saveNotesHeader';
export const FETCH_PATIENT_NOTE_TYPES = 'ApiTiaTeleMD/fetchPatientNotetypes';
export const FETCH_PATIENT_NOTE_WITH_TYPES = 'ApiTiaTeleMD/fetchPatientNoteswithTypes';
export const SAVE_PATIENT_NOTE_WITH_TYPES = 'ApiTiaTeleMD/saveNotes';
export const DELETE_PATIENT_NOTE_WITH_TYPES = 'ApiTiaTeleMD/deletenotes';

// Medication APIs
export const API_SEARCH_MEDICINES = 'ApiTiaTeleMD/searchMedicines';
export const API_GET_FREQUENCY_LIST = 'ApiTiaTeleMD/getFrequencyList';
export const API_GET_ROUTE_LIST = 'ApiTiaTeleMD/getRouteList';
export const API_ADD_MEDICATION = 'ApiTiaTeleMD/addMedicationOrder';
export const API_EDIT_MEDICATION = 'ApiTiaTeleMD/editMedicationOrder';
export const API_DELETE_MEDICATION = 'ApiTiaTeleMD/deleteMedicationOrder';
export const API_UPLOAD_PRESCRIPTION = 'ApiTiaTeleMD/uploadPatientPrescription';

// Investigation APIs
export const API_GET_INVESTIGATION_TYPE = 'ApiTiaTeleMD/getInvestigationTypes';
export const API_SAVE_INVESTIGATION = 'ApiTiaTeleMD/addInvestigation';
export const API_UPDATE_INVESTIGATION = 'ApiTiaTeleMD/updateInvestigation';
export const API_DELETE_INVESTIGATION = 'ApiTiaTeleMD/deleteInvestigation';
export const API_SEARCH_INVESTIGATION = 'ApiTiaTeleMD/searchInvestigationTypes';

// ICD/CPT APIs
export const API_FETCH_ICD_FAV_LIST = 'ApiTiaTeleMD/getIcdCptFavoriteList';
export const API_FETCH_ICD_SEARCH_DATA = 'ApiTiaTeleMD/searchProblemProcedureLists';
export const API_SAVE_ICD_CPT_DATA = 'ApiTiaTeleMD/saveProblemProcedure';
export const API_FETCH_ICD_CPT_GROUP_LIST = 'ApiTiaTeleMD/getIcdCptGroupList';
export const API_ADD_REMOVE_FAVOURITES = 'ApiTiaTeleMD/addOrRemoveIcdCptFavorites';
export const API_FETCH_LAST_USED_ICD_CPT = 'ApiTiaTeleMD/fetchPatientLastUsedRecords';

// Dashboard APIs
export const API_GET_DASHBOARD_DATA = 'ApiTiaTeleMD/getTeleDashboard';
export const API_GET_MENU_LIST = 'ApiTiaTeleMD/teleDashboardMenuList';
export const API_FAVOURITE_DASHBOARD = 'ApiTiaTeleMD/favoriteTeleDashboard';
export const API_CHECK_BANDWIDTH = 'ApiTiaTeleMD/uploadBandwidthImage';

// Appointment APIs
export const API_GET_DOCTOR_APPOINTMENTS = 'ApiTiaTeleMD/getDoctorAppointments';
export const API_FETCH_REASONS = 'ApiTiaTeleMD/fetchAppointmentReasons';
export const API_FETCH_TIME_SLOTS = 'ApiTiaTeleMD/fetchAvailableTimeSlots';
export const API_GET_DOCTOR_BOOKING_STATUS = 'ApiTiaTeleMD/getDoctorBookingStatus';
export const API_MAKE_APPOINTMENT_BOOKING = 'ApiTiaTeleMD/makeBooking';
export const API_CANCEL_BOOKING = 'ApiTiaTeleMD/cancelBooking';
export const API_RESCHEDULE_APPOINTMENT_BOOKING = 'ApiTiaTeleMD/appointmentReschedule';
export const API_APPOINTMENT_CHECKEDIN = 'ApiTiaTeleMD/appointmentCheckedIn';
export const API_END_VISIT = 'ApiTiaTeleMD/closeVisit';
export const API_FETCH_APPOINTMENT_HISTORY = 'ApiTiaTeleMD/appointmentHistory';
export const API_CANCEL_APPOINTMENT_REQUEST = 'ApiTiaTeleMD/cancelappointmentRequest';
export const API_FETCH_PATIENT_TYPES = 'ApiTiaTeleMD/fetchVisitsubTypes';
export const API_SEND_MEETLINK_TO_PATIENT = 'ApiTiaTeleMD/sendMeetingLinkToPatient';

// Inbox APIs
export const API_FETCH_INBOX_MESSAGES = 'ApiTiaTeleMD/fetchInboxMessages';
export const API_SAVE_INBOX_MESSAGES = 'ApiTiaTeleMD/saveInboxMessages';
export const API_FETCH_INBOX_REPLY_MESSAGES = 'ApiTiaTeleMD/fetchInboxMessagesDetails';
export const API_DELETE_OR_FAVOURITE_MESSAGE = 'ApiTiaTeleMD/deleteOrFavouriteInboxMessages';
export const API_DELETE_INBOX_MESSAGE = 'ApiTiaTeleMD/deleteInboxMessages';
export const API_DELETE_INBOX_MESSAGE_THREAD = 'ApiTiaTeleMD/deleteMessageThread';
export const API_MARK_AS_READ_MESSAGE = 'ApiTiaTeleMD/markAsReadInboxMessages';
export const API_FETCH_ALERT_MESSAGES = 'ApiTiaTeleMD/fetchAlertMessages';
export const API_DELETE_ALERT_MESSAGES = 'ApiTiaTeleMD/deleteAlertMessages';
export const API_MARK_ALL_READ_ALERT_MESSAGES = 'ApiTiaTeleMD/markAllreadAlertmessages';

// File Share APIs
export const API_FETCH_FILE_TYPE = 'ApiTiaTeleMD/fetchfileTypes';
export const API_UPLOAD_FILE_DOCS = 'ApiTiaTeleMD/uploadFilesDoc';
export const API_FETCH_ALL_DOCS = 'ApiTiaTeleMD/fetchAllDocuments';
export const API_DELETE_UPLOAD_FILES = 'ApiTiaTeleMD/deleteuploadFiles';
export const API_FETCH_FILESHARE_GROUP_LIST = 'ApiTiaTeleMD/fetchGroupsList';
export const API_GET_FILES_LIST = 'ApiTiaTeleMD/getAllFilesList';
export const API_GET_DOCTOR_LIST = 'ApiTiaTeleMD/getAllDoctorsLists';
export const API_SHARE_DOC_TO_USERS = 'ApiTiaTeleMD/shareDocumentToUsers';
export const UPLOAD_RECORDING_FILES = 'ApiTiaTeleMD/uploadrecordingfiles';
export const API_FETCH_DOC_TYPES = 'ApiTiaTeleMD/fetchdocumentTypes';

// Rounding List APIs
export const API_CHANGE_ROUNDING_LIST_SEEN_STATUS = 'ApiTiaTeleMD/changeRoundingListSeenStatus';
export const API_FETCH_ROUNDING_LIST = 'ApiTiaTeleMD/fetchRoundingListDetails';
export const API_SAVE_PATIENT_TO_ROUNDLIST = 'ApiTiaTeleMD/addPatientToRoundingList';
export const API_DELETE_FROM_ROUNDLIST = 'ApiTiaTeleMD/deletePatientFromRoundingList';
export const API_CHANGE_ROUNDING_LIST_SIGN_STATUS = 'ApiTiaTeleMD/changeRoundingListSignStatus';

// Task List APIs
export const API_FETCH_TASK_LIST = 'ApiTiaTeleMD/getTaskListsNew';
export const API_FETCH_TASK_DETAILS = 'ApiTiaTeleMD/fetchTaskDetails';
export const API_CHANGE_TASK_STATUS = 'ApiTiaTeleMD/changeStatusCareplanTask';
export const API_FETCH_TASK_ESCALATION_LIST = 'ApiTiaTeleMD/getTaskListsEscalation';
export const API_FETCH_ESCALATION_FILTER_ELEMENTS = 'ApiTiaTeleMD/fetchEscalationSearchFields';
export const API_FETCH_TASK_COMMENT_LIST = 'ApiTiaTeleMD/fetchTasksListComments';
export const API_SAVE_TASK_COMMENT = 'ApiTiaTeleMD/saveTasksListComments';
export const API_FETCH_TIADIGEST_NOTES = 'ApiTiaTeleMD/fetchTiadigestTaskListNotes';
export const API_FETCH_CARE_ELEMENTS = 'ApiTiaTeleMD/getCareElements';

// ICU List APIs
export const API_FETCH_ICU_LIST = 'ApiTiaTeleMD/fetchIcuList';
export const API_FETCH_ICU_ROOM_TYPES = 'ApiTiaTeleMD/fetchRoomTypes';
export const API_SEARCH_ICU_PAT_LIST = 'ApiTiaTeleMD/searchIcuPatientList';
export const API_FETCH_ICU_PATIENT_REMARKS = 'ApiTiaTeleMD/fetchIcuPatientRemarks';
export const API_SAVE_ICU_PATIENT_REMARKS = 'ApiTiaTeleMD/saveIcuPatientRemarks';
export const API_CONTROL_ICU_CAMERA = 'ApiTiaTeleMD/rotateCameraIcuList';
export const API_LOAD_WAVE_FORM = 'ApiTiaTeleMD/loadIcuWaveForm';

// Lab Results APIs
export const API_FETCH_LAB_RESULT_FILES = 'ApiTiaTeleMD/fetchResultsOfTest';
export const API_SAVE_LAB_RESULT_FILES = 'ApiTiaTeleMD/resultOfTestUpload';
export const API_DELETE_LAB_RESULT_FILES = 'ApiTiaTeleMD/deleteResultsOfTest';

// Radiology APIs
export const API_GET_STUDYLIST = 'getStudyList';
export const API_GET_SERIESLIST = 'getSeriesList';

// Doctor & Organization APIs
export const API_FETCH_COUNTRY_LIST = 'ApiTiaTeleMD/fetchCountryList';
export const API_FETCH_STATE_LIST = 'ApiTiaTeleMD/fetchStateList';
export const API_FETCH_CITY_LIST = 'ApiTiaTeleMD/fetchCityList';
export const API_FETCH_SPECIALITY = 'ApiTiaTeleMD/fetchSpeciality';
export const API_FETCH_SUBSPECIALITY = 'ApiTiaTeleMD/fetchSubSpeciality';
export const API_CREATE_USER = 'ApiTiaTeleMD/doctorCreation';
export const API_FETCH_DOCTOR_LIST = 'ApiTiaTeleMD/fetchDoctorsList';
export const API_FETCH_PRACTICE_LOCATIONS = 'ApiTiaTeleMD/fetchPracticeLocations';
export const API_FETCH_DOC_SCHEDULE = 'ApiTiaTeleMD/fetchDoctorSchedule';
export const API_FETCH_ORGANIZATION_LIST = 'ApiTiaTeleMD/fetchOrganizationList';
export const API_SAVE_DOC_ORGANIZATION = 'ApiTiaTeleMD/saveDoctorOrganization';
export const API_GET_DOCTOR_LIST_ORGWISE = 'ApiTiaTeleMD/getOrganizationDoctors';
export const API_DOWNLOAD_REFERAL_DETAILS = 'ApiTiaTeleMD/downloadReferalDetails';
export const API_DOWNLOAD_VISIT_DETAILS = 'ApiTiaTeleMD/downloadVisitDetails';
export const API_FETCH_CASE_LIST = 'ApiTiaTeleMD/fetchdoctorsCaseList';
export const FETCH_MAPPED_ASSIGNED_DOC_LIST = 'ApiTiaTeleMD/fetchMappedAssignedDocList';
export const SAVE_ASSIGNED_DOC = 'ApiTiaTeleMD/saveAssignedDoctor';

// Profile APIs
export const API_SAVE_PROFILE_IMAGE = 'ApiTiaTeleMD/saveProfileImage';
export const API_FETCH_PROFILE_IMAGE = 'ApiTiaTeleMD/fetchProfileImage';
export const API_FETCH_DEFAULT_PROFILE_IMAGE = 'packages/vitals/images/avatar.png';

// Call Feedback APIs
export const API_FETCH_CONCERN_TYPES = 'ApiTiaTeleMD/fetchConcernTypes';
export const API_SAVE_CONCERN_DETAILS = 'ApiTiaTeleMD/saveConcernTypes';
export const API_FETCH_QUESTIONS = 'ApiTiaTeleMD/fetchQuestions';
export const API_SAVE_CALL_FEEDBACK = 'ApiTiaTeleMD/saveCallFeedback';

// Patient APIs
export const API_FETCH_VITAL_HISTORY = 'ApiTiaTeleMD/fetchvitalhistory';
export const API_SEARCH_PATIENTS = 'ApiTiaTeleMD/searchPatientbynames';
export const API_SAVE_PATIENT_FOLLOW_UP = 'ApiTiaTeleMD/savePatientFollowup';
export const API_GET_COUNTRY_CODE = 'ApiTiaTeleMD/getCountryCode';

// Other APIs
export const API_UPLOAD_MEDIA = 'uploadMediaFile';
export const SEARCH_DATA = 'searchData';
export const FETCH_FAVORITE_VALUES = 'fetchFavoriteItemValues';
export const ADD_VOICE_FILE_UPLOAD = 'addVoiceFileUpload';
export const API_LOCATION_APPDATA = 'getAppDetailsByLocation';
export const API_FETCH_DOC_LOC_GROUP = 'ApiTiaTeleMD/fetchDoctorLocationAndGroup';
export const API_GET_AUTOCLONE_STATUS = 'ApiTiaTeleMD/checkEncounterCloneStatus';
export const API_FETCH_SUPPORT_DETAILS = 'ApiTiaTeleMD/fetchSupportdetails';
export const API_FETCH_CAPTCHA_QUESTIONS = 'ApiTiaTeleMD/fetchcaptchaQuestions';
export const API_SEND_RESET_PASS_OTP = 'ApiTiaTeleMD/sendResetPasswordOtpNew';
export const API_SEND_USER_NAME = 'ApiTiaTeleMD/sendUserNameEmail';
export const API_SAVE_NEW_PASSSWORD = 'ApiTiaTeleMD/savePasswordNew';
export const API_SEARCH_MESSAGES = 'ApiTiaTeleMD/searchChatMessages';
export const API_FETCH_GROUP_SCHEDULE_DETAILS = 'ApiTiaTeleMD/getGroupScheduleView';
export const API_FETCH_ALL_NEWSLETTERS = 'ApiTiaTeleMD/getAllNewsLetters';
export const API_FETCH_USER_NEWSLETTERS = 'ApiTiaTeleMD/getUserNewsLetter';
export const API_FETCH_CLOSE_USER_NEWSLETTER = 'ApiTiaTeleMD/closeUserNewsLetter';
export const API_FETCH_MULTIFACTOR_AUTH_DETIALS = 'ApiTiaTeleMD/fetchMultifactorDetails';
export const API_VALIDATE_MULTIFACTOR_AUTH = 'ApiTiaTeleMD/validateMultifactorToken';

// Socket Events
export const JOIN_GROUP = 'setUser';

// Help
export const HELP_CONTENT_URL = 'core/privacypolicy';

// Colors (primary used app-wide; chat colors match StrokeTeamOne activity_chat_main)
export const COLORS = {
  primary: '#007AFF',
  /** StrokeTeamOne blue_light - tab selected, loading indicator */
  chatBlueLight: '#005aa4',
  /** StrokeTeamOne blue_dark - header, Start New Chat button */
  chatBlueDark: '#002289',
  secondary: '#5856D6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  light: '#F2F2F7',
  dark: '#000000',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8E8E93',
  lightGray: '#C7C7CC',
  background: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
};

// Fonts
export const FONTS = {
  primaryBold: 'Montserrat-Bold',
  primaryLight: 'Montserrat-Light',
  primaryMedium: 'Montserrat-Medium',
  primaryRegular: 'Montserrat-Regular',
};

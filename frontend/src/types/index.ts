/**
 * TypeScript Type Definitions
 */

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MFA: { userName: string };
  OrganizationSelection: { organizations?: any[] } | undefined;
  MainTabs: undefined;
  VideoCall: { roomId?: string; joiningRoomId?: string; callType?: string };
  JitsiMeeting: { room: string; userInfo?: any; serverURL?: string; audioOnly?: boolean; videoMuted?: boolean };
  ConferenceCall: undefined;
  JoinWithMeetingID: undefined;
  Chat: { chatId: string; chatName: string; isGroup?: boolean; receiverId?: string };
  InboxDetails: { messageId: string };
  Directory: { fromStartNewChat?: boolean } | undefined;
  Newsletters: undefined;
  SupportFeedback: undefined;
  Help: undefined;
  CallLogs: undefined;
  FileShare: undefined;
  PdfViewer: { pdfUrl: string; title?: string };
  Encounter: { patientId: string; encounterId?: string };
  PatientHistory: { patientId: string };
  Appointment: { appointmentId?: string };

  // Investigations Module
  InvestigationsList: { patientId?: string; patientName?: string; roundId?: string; mrn?: string };
  InvestigationTypes: { patientId?: string; patientName?: string; roundId?: string; mrn?: string };
  RadiologyStudyList: { patientId?: string; patientName?: string; mrn?: string };
  DicomSeriesViewer: { studyId: string; patientName?: string; modality?: string };
  InvestigationResult: { investigationId: string; investigationType?: string; patientId?: string; patientName?: string };
  LabResultUpload: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; encounterData?: string };

  // Task Module
  TaskList: { patientId?: string; patientName?: string };
  TaskEscalation: { patientId?: string; patientName?: string; roundId?: string; mrn?: string };
  TaskDetails: { taskId: string; patientId?: string; patientName?: string };
  TaskComments: { taskId: string; taskTitle?: string };
  TaskFilter: { currentFilters?: any; onApplyFilters?: (filters: any) => void };

  // ICU Module
  ICUList: undefined;
  ICURoomTypes: { onFilterApplied?: (filters: any) => void };
  ICUPatientDetails: { patientId: string; patientName?: string; roundId?: string; mrn?: string };
  ICURemarks: { patientId: string; patientName?: string; roundId?: string };
  ICUCameraControl: { patientId: string; patientName?: string; cameraUrl?: string; roomNumber?: string };
  WaveformDisplay: { patientId: string; patientName?: string; waveformUrl?: string };
  ICUAlert: { patientId?: string; alertId?: string };

  // Clinical Assessment Module
  ClinicalAssessment: { patientId?: string; patientName?: string; roundId?: string; mrn?: string };
  AssessmentHistory: { assessmentId: string; formName?: string; patientId?: string };
  FormCategories: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; assessmentId?: string; isEdit?: boolean; isCopy?: boolean };
  FormItems: { categoryId: string; templateId: string; templateName?: string; patientId?: string; patientName?: string; roundId?: string; assessmentId?: string; isEdit?: boolean };
  StrokeScale: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; scaleType?: 'NIH' | 'HEART' };
  ICDCPT: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; encounterData?: string };
  FavouriteICDCPT: { codeType: 'ICD' | 'CPT'; onCodeSelected?: (code: any) => void };

  // Notes Module
  PatientNotes: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; consultDate?: string };
  NoteTypes: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; consultDate?: string };
  NotesEditor: { noteId?: string; noteTypeId?: string; noteTypeName?: string; noteTitle?: string; templateId?: string; patientId?: string; patientName?: string; roundId?: string; mrn?: string; consultDate?: string; isCreate?: boolean; isView?: boolean };
  VoiceRecord: { onTextReceived?: (text: string) => void };
  NotesWebView: { noteTitle?: string; noteContent?: string; patientName?: string; mrn?: string; pdfUrl?: string };

  // Medications Module
  MedicationsLabOrders: { patientId?: string; patientName?: string; roundId?: string; mrn?: string; doctorId?: string; encounterData?: string; editMode?: boolean; prescriptionId?: string };
  AddPrescription: { patientId?: string; patientName?: string; doctorId?: string; prescriptionData?: any; position?: number; onMedicationAdded?: (item: any) => void; onMedicationUpdated?: (item: any, pos: number) => void };
  UploadPrescription: { patientId?: string; patientName?: string; doctorId?: string; encounterData?: string; mrn?: string; editMode?: boolean; prescriptionId?: string };
  SearchMedicines: { patientId?: string; doctorId?: string; onMedicineSelected?: (medicine: any) => void };
  FrequencyRouteList: { listType: 'frequency' | 'route'; selectedId?: string; onItemSelected?: (item: any) => void };

  [key: string]: any;
};

export type MainTabParamList = {
  Dashboard: undefined;
  DoctorList: undefined; // Replaces Inbox
  Chats: undefined;
  Menu: undefined;
};

// User Types
export interface User {
  userId: string;
  userName: string;
  doctorId?: string;
  doctorName?: string;
  userLevel: number;
  isAdmin: boolean;
  designation?: string;
  timezone?: string;
  specialityId?: string;
  nuanceOrg?: string;
  nuanceGuid?: string;
  nuanceUser?: string;
  profileImage?: string;
  onlineStatus?: boolean;
  available?: boolean;
}

export interface Organization {
  organizationId: string;
  organizationName: string;
  practiceLocations?: PracticeLocation[];
}

export interface PracticeLocation {
  id: string;
  name: string;
}

// Authentication Types
export interface LoginResponse {
  code: string;
  status: string;
  sessionId?: string;
  chat_user_name?: string;
  data?: {
    userId: number;
    user_name: string;
    doctor_id?: number;
    doctor_name?: string;
    userLevel: number;
    admin: boolean;
    designation?: string;
    timezone?: string;
    speciality_id?: number;
    nuance_org?: string;
    nuance_guid?: string;
    nuance_user?: string;
    multifactor_status?: number;
    organizations?: Array<{
      organizationId?: number;
      id?: number;
      organizationName?: string;
      name?: string;
      practice_array?: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
  is_password_wrong?: string;
  count?: number;
}

export interface MFAResponse {
  code: string;
  status: string;
  data?: {
    token?: string;
    qrCode?: string;
  };
}

// Patient Types
export interface Patient {
  patientId: string;
  patientName: string;
  dob?: string;
  age?: string;
  gender?: string;
  mobile?: string;
  email?: string;
  address?: string;
  enrollmentId?: string;
  reason?: string;
}

export interface Encounter {
  encounterId: string;
  patientId: string;
  patientName: string;
  encounterDate: string;
  encounterType?: string;
  status?: string;
  isSeen?: boolean;
  isSigned?: boolean;
}

// Dashboard Types
export interface DashboardItem {
  id: string;
  title: string;
  type: string;
  patientId?: string;
  encounterId?: string;
  appointmentId?: string;
  date?: string;
  status?: string;
  isFavorite?: boolean;
}

export interface DashboardPatient {
  patient_id?: string;
  patientId?: string;
  patient_name?: string;
  patientName?: string;
  firstName?: string;
  first_name?: string;
  middleName?: string;
  middle_name?: string;
  lastName?: string;
  last_name?: string;
  mrn?: string;
  dob?: string;
  patient_dob?: string;
  age?: string;
  gender?: string;
  genderhome?: string;
  attending_physician?: string;
  attendingphysician?: string;
  primary_care_physician?: string;
  primary_care_physician_name?: string;
  pcp?: string;
  date?: string;
  patient_type?: string;
  patientType?: string;
  bed_name?: string;
  bed?: string;
  doa?: string;
  admit_date?: string;
  room_no?: string;
  roomNo?: string;
  round_id?: string;
  roundID?: string;
  seen_ind?: boolean;
  isSeenind?: boolean;
  signed_status?: boolean;
  signedStatus?: boolean;
  appointment_id?: string;
  appointmentId?: string;
  appmt_id?: string;
  booking_type?: string;
  bookingType?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  start_datetime?: string;
  startDateTime?: string;
  speciality?: string;
  speciality_name?: string;
  video_link?: string;
  videoLink?: string;
  practice_id?: string;
  practice_name?: string;
  practiceName?: string;
  organization_name?: string;
  organizationName?: string;
  assign_to?: string;
  assigntodocfirstname?: string;
  assigntodoclastname?: string;
  assigntoproviderid?: string;
  image_path?: string;
  imagePath?: string;
  phone?: string;
  mobile_no?: string;
  email?: string;
  [key: string]: any;
}

export interface TeleAppointment {
  patientList?: DashboardPatient[];
  patientListArray?: DashboardPatient[];
  Appointments?: DashboardPatient[];
  appointmentsArray?: DashboardPatient[];
  IpList?: DashboardPatient[];
  ipListArray?: DashboardPatient[];
  RoundingList?: DashboardPatient[];
  roundingListArray?: DashboardPatient[];
  MyPatients?: DashboardPatient[];
  mypatientsArray?: DashboardPatient[];
  OpList?: DashboardPatient[];
  opListArray?: DashboardPatient[];
  total_count?: string;
  totalCount?: string;
  seen_count?: string;
  seenCount?: string;
  call_block_warning_value?: string;
  payment_status?: string;
  inbox_unread_count?: string;
  alert_unread_count?: string;
  appointment_enabled_flag?: string;
  chat_approval_patient?: string;
  chat_approval_doctor?: string;
  [key: string]: any;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  speciality: string;
  city: string;
  onlineStatus: 'online' | 'idle' | 'offline';
  oncall_status: string;
  profileImage?: string;
  onlineOrder?: string;
}

export interface Newsletter {
  id?: string;
  file_name?: string;
  filename?: string;
  label?: string;
  remarks?: string;
  created_at?: string;
  start_date?: string;
  end_date?: string;
  file_url?: string;
  news_letters?: Newsletter[];
  newslestters?: Newsletter[];
}

// Inbox Types
export interface InboxMessage {
  messageId: string;
  subject: string;
  message: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  timestamp: string;
  isRead: boolean;
  isFavorite: boolean;
  attachments?: Attachment[];
  replies?: InboxMessage[];
}

export interface AlertMessage {
  alertId: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  isRead: boolean;
}

// Chat Types (match Swift/Android backend)
export interface Chat {
  chatId: string;
  chatName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup: boolean;
  participants?: User[];
  avatar?: string;
  /** Backend: broadcast_id */
  broadcastId?: string;
  /** Backend: member_id / user_id for 1-1 */
  receiverId?: string;
  /** Backend: group_chat */
  group_chat?: string;
  last_msg_user_name?: string;
  type?: string;
  fileName?: string;
}

/** Chat request (pending request to chat) – matches Android ChatRequest */
export interface ChatRequest {
  broadcast_id: string;
  user_id: string;
  user_name: string;
  created_at?: string;
  chat_type?: string;
  appointment_id?: string;
}

export interface ChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video';
  attachments?: Attachment[];
  isRead?: boolean;
  /** Backend: broadCastId / broadcast_id */
  broadCastId?: string;
  /** Backend: type (text/image etc) */
  type?: string;
  sortTime?: string;
}

export interface Attachment {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  fileUrl?: string;
  thumbnailUrl?: string;
}

// Conference Call Types (Matches StrokeTeamOne GroupContactNew, GroupUser)
export interface GroupUser {
  id: string;
  userName: string;
  selected?: boolean;
}

export interface GroupContactNew {
  rolename: string;
  users: GroupUser[];
}

// Call Log Types (Matches StrokeTeamOne CallLog model)
export interface CallLog {
  user_name?: string;
  sender_name?: string;
  user_id?: string;
  sender_id?: string;
  call_status?: string;
  call_start?: string;
  call_end?: string;
  call_duration?: string;
  call_time?: string;
  profile_img?: string;
  count?: string;
  total_count?: string;
}

// Call Types
export interface Call {
  callId: string;
  roomId: string;
  callType: 'DirectCall' | 'GroupCall' | 'AppointmentCall' | 'CallLogCall' | 'Emergency';
  participants: string[];
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'connecting' | 'active' | 'ended';
  isModerator?: boolean;
}

// Appointment Types
export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled';
  appointmentType?: string;
}

// Task Types
export interface Task {
  taskId: string;
  title: string;
  description?: string;
  patientId?: string;
  patientName?: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  commentId: string;
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

// ICU Types
export interface ICUPatient {
  patientId: string;
  patientName: string;
  roomNumber?: string;
  roomType?: string;
  admissionDate?: string;
  status?: string;
  remarks?: ICURemark[];
  cameraAccess?: boolean;
}

export interface ICURemark {
  remarkId: string;
  patientId: string;
  userId: string;
  userName: string;
  remark: string;
  timestamp: string;
}

// File Share Types
export interface FileShare {
  id?: string;
  file_id?: string;
  fileid?: string;
  filename?: string;
  file_name?: string;
  filepath?: string;
  file_path?: string;
  filetype?: string;
  file_type?: string;
  fileextension?: string;
  file_extension?: string;
  filesize?: string;
  file_size?: string;
  uploadeddate?: string;
  uploaded_date?: string;
  shared_time?: string;
  patientname?: string;
  patient_name?: string;
  mrn?: string;
  notes?: string;
  sharedfrom?: string;
  shared_from?: string;
  sharedtill?: string;
  shared_till?: string;
  shareid?: string;
  share_id?: string;
  shareby?: string;
  share_by?: string;
  sharewith?: string;
  share_with?: string;
  docname?: string;
  doc_name?: string;
  groupname?: string;
  group_name?: string;
  group_id?: string;
  downloadbtnvisible?: number;
  download_btn_visible?: number;
  countofmyfiles?: number;
  count_of_my_files?: number;
  countofsharedwith?: number;
  count_of_shared_with?: number;
  allfiles?: FileShare[];
  all_files?: FileShare[];
  filetypes?: FileShare[];
  file_types?: FileShare[];
  grouplist?: FileShare[];
  group_list?: FileShare[];
  patientdata?: FileShare[];
  patient_data?: FileShare[];
  myfilesdata?: FileShare[];
  my_files_data?: FileShare[];
  sharedwith?: FileShare[];
  shared_with?: FileShare[];
  share_by_users_list?: ShareByObj[];
}

export interface ShareByObj {
  user_id?: string;
  user_name?: string;
  userName?: string;
}

// Legacy interface for backward compatibility
export interface SharedFile {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedDate: string;
  sharedWith: string[];
  fileUrl: string;
}

// Medication Types
export interface Medication {
  medicationId: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
}

// Investigation Types
export interface Investigation {
  investigationId: string;
  investigationName: string;
  investigationType: string;
  orderedDate?: string;
  status?: string;
  results?: string;
}

// Clinical Assessment Types
export interface ClinicalAssessment {
  assessmentId: string;
  formCategory: string;
  formTemplate: string;
  patientId: string;
  assessmentDate: string;
  formData: Record<string, any>;
  isFavorite?: boolean;
}

// Notes Types
export interface Note {
  noteId: string;
  noteType: string;
  patientId: string;
  noteText: string;
  createdBy: string;
  createdByName: string;
  createdDate: string;
  updatedDate?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  code: string;
  status: string;
  data?: T;
  message?: string;
  sessionId?: string;
}

// Socket Event Types
export interface SocketEvent {
  event: string;
  data: any;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

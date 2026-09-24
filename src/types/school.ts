// Types de données stricts pour BetterSchool
// Conçus pour être facilement reliés à une API backend (REST, GraphQL, Supabase, etc.)

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Lundi ... 6=Samedi, 7=Dimanche

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  studentClass: string;
  schoolName: string;
  academicYear: string;
  ineNumber: string;
  unreadNotifications: number;
}

export type EventType = 'cours' | 'ds' | 'tp' | 'td' | 'oral';
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'slides' | 'link' | 'code';
  size?: string;
  url?: string;
}

export interface CourseEvent {
  id: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  date: string;      // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  type: EventType;
  color: string;
  description?: string;
  status: EventStatus;
  wholeDay?: boolean;
  plannedElementType?: string;
  homeworkDue?: Homework[];
  materials?: CourseMaterial[];
}

export interface Homework {
  id: string;
  courseEventId?: string;
  subject: string;
  subjectCode: string;
  color: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedTimeMinutes: number;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  assignedDate: string;
  hasAttachment?: boolean;
  platformId?: string;
  assignmentId?: string;
  plannedElementType?: string;
}

export interface GradeGoal {
  title?: string;
  scoreText: string;
  obtained: number;
  total: number;
  percentage?: number;
  color?: string;
}

export interface Grade {
  id: string;
  subject: string;
  subjectCode: string;
  value: number;
  maxValue: number;
  coefficient: number;
  title: string;
  date: string;
  classAverage?: number;
  minGrade?: number;
  maxGrade?: number;
  teacherComment?: string;
  period: string;
  type?: 'DS' | 'DM' | 'TP' | 'Interro' | 'Oral' | string;
  // Enrichissements Skore
  obtainedPoints?: number;
  totalPoints?: number;
  rawScoreText?: string;
  isSommatif?: boolean;
  isManuallyExcluded?: boolean;
  color?: string;
  teacherName?: string;
  teacherPhoto?: string;
  availabilityDate?: string;
  feedbacks?: string[];
  goals?: GradeGoal[];
  evaluationType?: 'normal' | 'project';
  isFormative?: boolean;
}

export interface SubjectReport {
  subject: string;
  subjectCode: string;
  color: string;
  teacher: string;
  coefficient: number;
  studentAverage: number | null;
  classAverage?: number | null;
  minAverage?: number | null;
  maxAverage?: number | null;
  grades: Grade[];
  teacherAppreciation?: string;
  hoursPerWeek?: number;
  totalObtained?: number;
  totalPossible?: number;
  isFormativeOnly?: boolean;
}

// Structures natives Smartschool Skore API
export interface SkoreGraphic {
  type: string;
  color?: string;
  value?: number | string | null;
  description?: string | null;
}

export interface SkoreComponent {
  id: number;
  name: string;
  abbreviation: string;
}

export interface SkoreTeacher {
  id: string;
  pictureHash?: string;
  pictureUrl?: string;
  name: {
    startingWithFirstName?: string;
    startingWithLastName?: string;
  };
  deleted?: boolean;
}

export interface SkoreCourse {
  id: number;
  name: string;
  graphic?: {
    type: string;
    value: string;
  };
  teachers?: SkoreTeacher[];
  class?: {
    identifier: string;
    id: number;
    platformId: number;
    name: string;
    type?: string;
    icon?: string;
  };
}

export interface SkorePeriod {
  id: number;
  name: string;
  icon?: string;
  isActive?: boolean;
}

export interface SkoreProjectGoal {
  goal?: {
    goalId?: string;
    leerplanId?: string;
    leerplanKey?: string;
  };
  graphic: SkoreGraphic;
  feedback?: any[];
  feedbacks?: any[];
}

export interface SkoreEvaluation {
  identifier: string;
  type: 'project' | 'normal' | string;
  name: string;
  graphic: SkoreGraphic;
  date: string;
  gradebookOwner?: SkoreTeacher;
  component: SkoreComponent;
  courses: SkoreCourse[];
  period: SkorePeriod;
  feedback?: any[];
  feedbacks?: any[];
  availabilityDate?: string;
  isPublished?: boolean;
  doesCount?: boolean;
  details?: {
    projectGoals?: SkoreProjectGoal[];
    scales?: any[];
  };
}

export interface MessageAttachment {
  name: string;
  size: string;
  type: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'admin';
  senderAvatar: string;
  content: string;
  timestamp: string; // ISO ou formaté HH:mm
  read: boolean;
  isSelf: boolean;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  category: 'teachers' | 'admin' | 'groups';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  subject?: string;
}

export interface CourseDocument {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'archive' | 'link';
  size: string;
  uploadDate: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  documents: CourseDocument[];
}

export interface CourseAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  points: number;
  status: 'pending' | 'submitted' | 'graded';
  submittedFileName?: string;
  submittedAt?: string;
  feedback?: string;
  obtainedGrade?: number;
}

export interface SubjectCourse {
  id: string;
  subject: string;
  subjectCode: string;
  color: string;
  teacher: string;
  teacherEmail: string;
  room: string;
  hoursPerWeek: number;
  progressPercent: number;
  nextExam?: string;
  chapters: Chapter[];
  assignments: CourseAssignment[];
}


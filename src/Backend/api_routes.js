/**
 * API Routes Configuration
 *
 * This file contains all API endpoint routes for the Sahayya app.
 * Routes are organized by feature/module.
 */

// ===========================================
// AUTHENTICATION & USER
// ===========================================
export const GET_CMS_DATA = 'cms-page';
export const INTRO_API = 'customer/intro_api';
export const LOGIN = 'customer/login';
export const SIGINUP = 'customer/signup';
export const VERIFY_OTP = 'verify-otp';
export const OTP_LOGIN = 'otp-login';
export const RESEND_OTP = 'resend-otp';
export const PROFILE_UPDATE = 'profile/update';
export const POLICY = 'cms-page';
export const PROFILE = 'profile';
export const DELETE_ACCOUNT = 'user/delete-self';
export const LOGOUT = 'logout';

// ===========================================
// HOUSEHOLD / ADMIN
// ===========================================
export const AddJob = 'admin/jobs';
export const AddUser = 'admin/members/store';
export const ListUser = 'admin/members/list';
export const DeleteUser = 'admin/delete-user';
export const JobApplicationList = 'admin/jobs';
export const ApplicantsList = 'admin/jobs';
export const ApplicantsStatus = 'admin/applications';
export const Joblist_Admin = 'admin/auth-jobs';
export const UpdateMember = 'admin/members';
export const DELETE_Member = 'delete/member';

// ===========================================
// STAFF MANAGEMENT
// ===========================================
export const AddStaff = 'staff/add';
export const UpdateStaff = 'staff/update';
export const ListStaff = 'staff/list';
export const applicationsList = 'applications';
export const QuitJob = 'quit-job-request';
export const myWork = 'mywork';
export const myWorkJobs = 'admin/jobs';

// ===========================================
// KYC & VERIFICATION
// ===========================================
export const AADHAR_SAVE = 'aadhar/send-otp';
export const AADHAR_VERFIY = 'aadhar/verify';
export const AADHAR_RESEND_OTP = 'aadhar/resend-otp';
export const AADHAR_STATUS = 'aadhar/status';
export const KYC_UPLOAD = 'kyc/upload';
export const KYC_STATUS = 'kyc/status';
export const ADDRESSES_UPDATE = 'addresses/update';

// ===========================================
// CATEGORIES & WORK
// ===========================================
export const CATEGORY = 'category';
export const SUB_CATEGORY = 'category/subcategories';
export const WORK_INFO = 'work-info-update';
export const LAST_WORK_INFO = 'last-work-experience/save';

// ===========================================
// JOBS
// ===========================================
export const ListJob = 'jobs';
export const Apply_Job = 'applications';

// ===========================================
// LEAVE MANAGEMENT
// ===========================================
export const LeaveList = 'leave-type-list';
export const ApplyLeave = 'leave-apply';
export const LeaveListUser = 'leave-list';
export const LeaveRejectr = 'leave-reject';
export const LeaveApprove = 'leave-approve';

// ===========================================
// SALARY MANAGEMENT
// ===========================================
export const SalaryManagementStaff = 'housesold/salary/staff';
export const SalaryStore = 'admin/salary/store';
export const SalaryList = 'housesold/salary/list';
export const SalarySendToBank = (id) => `housesold/salary/${id}/send-to-bank`;
export const SalaryPayoutHistory = (id) => `housesold/salary/${id}/payouts`;
export const EarningSummary = 'earnings/summary';
export const SalarySlipDownload = 'salary/slip';
export const SalaryAdvanceRequest = 'salary/advance/request';
export const SalaryAdvanceList = 'salary/advance/list';
export const SalaryAdvanceApprove = 'salary/advance/approve';
export const SalaryAdvanceReject = 'salary/advance/reject';
export const AdvanceWithdraw = 'advance-withdraw';

// ===========================================
// ADVANCE & DEDUCTION MANAGEMENT
// ===========================================
export const AdvanceList          = 'advances';                        // GET  - employer list
export const AdvanceStore         = 'advances';                        // POST - give advance
export const AdvanceDetail        = 'advances';                        // GET  - single detail (append /{id})
export const AdvanceDeduct        = 'advances';                        // POST - manual deduct (append /{id}/deduct)
export const AdvancePending       = 'advances/pending-deduction';      // GET  - pending deduction (append /{staff_id})
export const MyAdvances           = 'my-advances';                     // GET  - staff sees their advances
export const SalaryBonusAdd = 'salary/bonus/add';
export const SalaryEmiAdd = 'salary/emi/add';
export const SalaryEmiList = 'salary/emi/list';
export const SalaryAdjustment = 'salary/adjustment';
export const SalaryConfirmReceipt = 'customer/salary/confirm';
export const SalaryBreakdown = 'customer/salary/breakdown';
export const SalaryUpdateStatus = 'admin/salary';

// ===========================================
// ATTENDANCE & DASHBOARD
// ===========================================
export const AutoPresentBtn = 'settings/AutoPresent';
export const ActiveTodayUser = 'housersold/staff/active-today';
export const HousersoldAttendance = 'admin/housersold/attendance'; 
export const customerDashbord = 'customer/dashbord-data';
export const AttendanceOverrideList = 'attendance/overrides';
export const AttendanceOverride = 'attendance/override';
export const AttendanceOverrideLog = 'attendance/override-log';
export const AttendanceStaff = 'admin/staff/attendance';
// ===========================================
// SETTINGS & NOTIFICATIONS
// ===========================================
export const GET_NOTIFICATION_SETTINGS = 'settings/notification';
export const SAVE_NOTIFICATION_SETTINGS = 'settings/notification';
export const SUBSCRIPTIONS = 'subscriptions';
export const SUBSCRIPTIONS_BY_ROLE = 'subscriptions/role';
export const SUBSCRIPTION_CURRENT = 'subscription/current';
export const SUBSCRIPTION_USER_CURRENT = 'subscription/current';
export const SUBSCRIPTION_USER_CREATE_ORDER = 'subscription/create-order';
export const SUBSCRIPTION_USER_VERIFY = 'subscription/verify-payment';
export const SUBSCRIPTION_USER_SUBSCRIBE = 'subscription/subscribe';
export const SUBSCRIPTION_HISTORY = 'subscription/history';
export const SUBSCRIPTION_CREATE_EXTRA_JOB_ORDER = 'subscription/create-extra-job-order';
export const SUBSCRIPTION_VERIFY_EXTRA_JOB_PAYMENT = 'subscription/verify-extra-job-payment';

export const SUBSCRIPTION_CREATE_EXTRA_STAFF_ORDER = 'subscription/create-extra-staff-order';
export const SUBSCRIPTION_VERIFY_EXTRA_STAFF_PAYMENT = 'subscription/verify-extra-staff-payment';


// ===========================================
// TERMINATIONS
// ===========================================
export const TerminateStaff = 'admin/terminations';

// ===========================================
// BLACKLIST STAFF
// ===========================================
export const BlacklistAdd = 'blacklist/add';
export const BlacklistList = 'blacklist/list';
export const BlacklistCheck = 'blacklist/check';
export const BlacklistRemove = 'blacklist/remove';
export const BlacklistDocuments = 'blacklist/documents';
export const BlacklistReport = 'blacklist/report';

// ===========================================
// HIRE ME / STAFF AVAILABILITY
// ===========================================
export const StaffAvailabilityUpdate = 'staff/availability/update';
export const StaffAvailabilityStatus = 'staff/availability/status';
export const StaffAvailableList = 'staff/available-list';
export const StaffGetAIData = 'admin/staff/get-ai-data';
export const VOICE_TRANSCRIBE = 'voice/transcribe';
export const JobGetAIData = 'admin/staff/get-job-data';
export const StaffAvailableDetail = 'staff/available';
export const HireMeOptIn = 'staff/hire-me/opt-in';
export const HireMeUpdate = 'staff/hire-me/update';
export const HireMePause = 'staff/hire-me/pause';
export const HireMeDeactivate = 'staff/hire-me/deactivate';

// ===========================================
// IN-APP NOTIFICATIONS
// ===========================================
export const NotificationList = 'notifications/list';
export const NotificationRead = 'notifications/read';
export const NotificationReadAll = 'notifications/read-all';
export const NotificationUnreadCount = 'notifications/unread-count';
export const DeviceTokenUpdate = 'device-token';

// ===========================================
// REVIEWS & RATINGS
// ===========================================
export const ReviewStore = 'reviews/store';
export const ReviewList = 'reviews/list';
export const ReviewListSelf = 'reviews/list-self';

// ===========================================
// SUPPORT & FAQ
// ===========================================
export const SupportCreate = 'supports';
export const SupportList = 'supports';
export const SupportReply = 'supports';
export const FaqList = 'faq-support';
export const FaqSearch = 'faq-support-search';

// ===========================================
// BANK ACCOUNTS
// ===========================================
export const BankAccountList = 'bank-accounts';
export const BankAccountAdd = 'bank-accounts';
export const BankAccountUpdate = 'bank-accounts/update';
export const BankAccountDelete = 'bank-accounts/delete';
export const BankAccountSetDefault = 'bank-accounts/set';

// ===========================================
// MULTI-LANGUAGE
// ===========================================
export const LanguageList = 'languages';
export const Translations = 'translations';

// ===========================================
// STAFF EMPLOYMENT HISTORY
// ===========================================
export const StaffEmploymentHistory = 'staff/employment-history';
export const StaffReferences = 'staff/references';

// ===========================================
// HOUSEHOLD MEMBER ROLES
// ===========================================
export const MemberAssignRole = 'admin/members/assign-role';

// ===========================================
// REFERRAL
// ===========================================
export const ReferralCode = 'admin/referral/code';
export const ReferralApply = 'admin/referral/apply';
export const ReferralHistory = 'admin/referral/history';
export const ReferralCreditApply = 'admin/referral/credit-apply';

// ===========================================
// PAYMENT ROUTES (Main Backend - Laravel)
// ===========================================
export const CREATE_ORDER = 'payment/create-order';
export const VERIFY_PAYMENT = 'payment/verify';
export const PAYMENT_HISTORY = 'payment/history';
export const SUBSCRIBE_PLAN = 'subscription/subscribe';
export const SALARY_PAYMENT = 'payment/salary';

// ===========================================
// JOB APPLY LIMIT SYSTEM
// ===========================================
export const JOB_LIMIT_STATUS = 'job-limit/status';
export const JOB_LIMIT_CREATE_ORDER = 'job-limit/create-order';
export const JOB_LIMIT_VERIFY_PAYMENT = 'job-limit/verify-payment';

// ===========================================
// RAZORPAY API ROUTES (PHP Backend)
// Based on API_DOCUMENTATION.md
// Base URL: http://localhost:8000/api/
// ===========================================
export const RAZORPAY_ROUTES = {
  // Create Order - Generates a unique Razorpay Order ID
  CREATE_ORDER: 'create-order.php',

  // Verify Payment - Verifies server-side signature
  VERIFY_PAYMENT: 'verify-payment.php',

  // Create Subscription - For recurring payments
  CREATE_SUBSCRIPTION: 'create-subscription.php',

  // Webhook Handler - Handles async events from Razorpay
  WEBHOOK: 'webhook.php',

  // AI Staff Search - Smart matching based on natural language
  FIND_STAFF_AI: 'find-staff-ai.php',
};

// ===========================================
// HELPER EXPORTS
// ===========================================
// Export individual Razorpay routes for easier access
export const RAZORPAY_CREATE_ORDER = RAZORPAY_ROUTES.CREATE_ORDER;
export const RAZORPAY_VERIFY_PAYMENT = RAZORPAY_ROUTES.VERIFY_PAYMENT;
export const RAZORPAY_CREATE_SUBSCRIPTION = RAZORPAY_ROUTES.CREATE_SUBSCRIPTION;
export const RAZORPAY_WEBHOOK = RAZORPAY_ROUTES.WEBHOOK;
export const RAZORPAY_FIND_STAFF_AI = RAZORPAY_ROUTES.FIND_STAFF_AI;

// ===========================================
// DEFAULT EXPORT
// ===========================================
export default {
  // Auth
  LOGIN,
  SIGINUP,
  VERIFY_OTP,
  RESEND_OTP,
  LOGOUT,
  PROFILE,
  PROFILE_UPDATE,

  // Payment
  CREATE_ORDER,
  VERIFY_PAYMENT,
  PAYMENT_HISTORY,
  SUBSCRIBE_PLAN,
  SALARY_PAYMENT,

  // Razorpay
  RAZORPAY_ROUTES,

  // Subscriptions
  SUBSCRIPTIONS,
  SUBSCRIPTIONS_BY_ROLE,
  SUBSCRIPTION_CURRENT,
  SUBSCRIPTION_HISTORY,

  // Blacklist
  BlacklistAdd,
  BlacklistList,
  BlacklistCheck,
  BlacklistRemove,
  BlacklistDocuments,
  BlacklistReport,

  // Hire Me / Staff Availability
  StaffAvailabilityUpdate,
  StaffAvailabilityStatus,
  StaffAvailableList,
  StaffAvailableDetail,
  HireMeOptIn,
  HireMeUpdate,
  HireMePause,
  HireMeDeactivate,

  // In-App Notifications
  NotificationList,
  NotificationRead,
  NotificationReadAll,
  NotificationUnreadCount,

  // Reviews & Ratings
  ReviewStore,
  ReviewList,
  ReviewListSelf,

  // Support & FAQ
  SupportCreate,
  SupportList,
  SupportReply,
  FaqList,
  FaqSearch,

  // Bank Accounts
  BankAccountList,
  BankAccountAdd,
  BankAccountUpdate,
  BankAccountDelete,
  BankAccountSetDefault,

  // Multi-Language
  LanguageList,
  Translations,

  // Staff Employment History
  StaffEmploymentHistory,
  StaffReferences,

  // Salary Enhancements
  SalarySlipDownload,
  SalaryAdvanceRequest,
  SalaryAdvanceList,
  SalaryAdvanceApprove,
  SalaryAdvanceReject,
  SalaryBonusAdd,
  SalaryEmiAdd,
  SalaryEmiList,
  SalaryAdjustment,
  SalarySendToBank,
  SalaryPayoutHistory,
  AdvanceWithdraw,
  AdvanceList,
  AdvanceStore,
  AdvanceDetail,
  AdvanceDeduct,
  AdvancePending,
  MyAdvances,
  SalaryConfirmReceipt,
  SalaryBreakdown,

  // Attendance Override
  AttendanceOverrideList,
  AttendanceOverride,
  AttendanceOverrideLog,

  // KYC Status
  AADHAR_RESEND_OTP,
  AADHAR_STATUS,
  KYC_STATUS,

  // Household Member Roles
  MemberAssignRole,
};

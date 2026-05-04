// ============================================
// API Configuration
// ============================================
// Change this IP address when you switch networks
// ============================================

// Your computer's IP address
const API_IP = '192.168.1.85'; // CHANGE THIS WHEN SWITCHING NETWORKS

// Base URL for your backend
export const API_BASE_URL = `http://${API_IP}/arms-backend`;

// Individual endpoints
export const API_ENDPOINTS = {
    // AUTH
    LOGIN: `${API_BASE_URL}/auth/login_unified.php`,
    SIGN_UP: `${API_BASE_URL}/auth/signup.php`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change_password_member.php`,

    // MEMBERSHIP / MEMBERS
    GET_USER_MEMBERSHIP: `${API_BASE_URL}/get_user_membership.php`,
    GET_MEMBERSHIP_PLANS: `${API_BASE_URL}/get_membership_plans.php`,
    UPDATE_PROFILE: `${API_BASE_URL}/pages/update_profile_member.php`,

    // QR CODE
    GENERATE_QR: `${API_BASE_URL}/generate_qr_token.php`,
    SCAN_QR: `${API_BASE_URL}/scan_qr_attendance.php`,

    // STAFF
    CHANGE_PASSWORD_STAFF: `${API_BASE_URL}/admin/change_password_staff.php`,
    UPDATE_PROFILE_STAFF: `${API_BASE_URL}/pages/staff/edit_staff.php`,

    // 🆕 PAYMENT
    // CREATE_PAYMENT_LINK: `${API_BASE_URL}/pages/payment/payment.php?action=create-link`,
    CREATE_PAYMENT_LINK: `${API_BASE_URL}/pages/payment/payment.php?action=create-checkout`,
    CHECK_PAYMENT_STATUS: `${API_BASE_URL}/pages/payment/payment.php?action=check-status`,
    PAYMENT_HISTORY: `${API_BASE_URL}/pages/payment/payment.php?action=history`,
    
    // SETTINGS
    GET_GYM_INFO: `${API_BASE_URL}/gym_info.php`,
    
    // 🆕 NOTIFICATIONS
    REGISTER_PUSH_TOKEN: `${API_BASE_URL}/notifications/notifications.php?action=register-token`,
    GET_NOTIFICATIONS: `${API_BASE_URL}/notifications/notifications.php?action=list`,
    MARK_NOTIFICATIONS_READ: `${API_BASE_URL}/notifications/notifications.php?action=mark-read`,

    UPDATE_AUTO_RENEW: `${API_BASE_URL}/update-auto-renew.php`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh_token.php`,
    VALIDATE_TOKEN: `${API_BASE_URL}/auth/validate_token.php`,

    REVIEW_VERIFICATION: `${API_BASE_URL}/pages/student/review_verification.php`,
    SUBMIT_STUDENT_VERIFICATION: `${API_BASE_URL}/pages/student/submit_student_verification.php`,
};

// Helper to get current IP (for debugging)
export const getCurrentIP = () => API_IP;

// Export for direct use
export default {
    API_BASE_URL,
    API_ENDPOINTS,
    getCurrentIP,
};
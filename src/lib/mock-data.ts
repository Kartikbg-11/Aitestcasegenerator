// Mock Data for AI Test Case Generator
// QA Testing Tool - Comprehensive mock dataset

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectStatus = "Active" | "Completed" | "On Hold";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  testCases: number;
  members: number;
  createdDate: string;
  priority: ProjectPriority;
}

export type UserRole = "QA_ENGINEER" | "QA_LEAD" | "ADMIN";
export type UserStatus = "Active" | "Inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  projects: number;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: string;
  status: "Processed" | "Uploaded" | "Processing" | "Failed";
  uploadedDate: string;
}

export type TestCasePriority = "Critical" | "High" | "Medium" | "Low";
export type TestCaseType = "Positive" | "Negative" | "Edge Case";
export type TestCaseStatus = "Draft" | "Ready" | "Approved" | "Failed" | "Passed";

export interface TestCase {
  id: string;
  projectId: string;
  title: string;
  module: string;
  priority: TestCasePriority;
  type: TestCaseType;
  status: TestCaseStatus;
  createdDate: string;
  assignedTo: string;
}

export type CoverageStatus = "Covered" | "Partial" | "Not Covered";

export interface RtmEntry {
  id: string;
  projectId: string;
  requirementId: string;
  requirementTitle: string;
  scenarioId: string;
  testCaseId: string;
  coverageStatus: CoverageStatus;
  gapAnalysis: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface MonthlyTrendItem {
  month: string;
  testCases: number;
  defects: number;
}

export interface DashboardChartData {
  testCasesByPriority: ChartDataItem[];
  testCasesByStatus: ChartDataItem[];
  defectsBySeverity: ChartDataItem[];
  monthlyTrend: MonthlyTrendItem[];
}

export interface GenerationResultItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  severity?: string;
}

export type GenerationResults = Record<string, GenerationResultItem[]>;

// ─── Mock Projects ──────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "E-Commerce Platform",
    description:
      "End-to-end QA testing for the online shopping platform including checkout, payments, and inventory management.",
    status: "Active",
    testCases: 147,
    members: 6,
    createdDate: "2024-11-15",
    priority: "High",
  },
  {
    id: "proj-002",
    name: "Banking Mobile App",
    description:
      "Test suite for the mobile banking application covering fund transfers, account management, and biometric auth.",
    status: "Active",
    testCases: 203,
    members: 8,
    createdDate: "2024-09-03",
    priority: "High",
  },
  {
    id: "proj-003",
    name: "Healthcare Portal",
    description:
      "QA validation for the patient portal including appointment scheduling, medical records access, and telehealth features.",
    status: "Active",
    testCases: 89,
    members: 4,
    createdDate: "2025-01-10",
    priority: "Medium",
  },
  {
    id: "proj-004",
    name: "HR Management System",
    description:
      "Testing the human resources management tool for payroll, leave management, employee onboarding, and performance reviews.",
    status: "Active",
    testCases: 64,
    members: 3,
    createdDate: "2025-02-20",
    priority: "Medium",
  },
  {
    id: "proj-005",
    name: "IoT Dashboard",
    description:
      "Quality assurance for the IoT device monitoring dashboard covering real-time data feeds, alerts, and device provisioning.",
    status: "Active",
    testCases: 42,
    members: 3,
    createdDate: "2025-03-05",
    priority: "Low",
  },
];

// ─── Mock Users ─────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: "user-001",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "QA_LEAD",
    status: "Active",
    avatar: "PS",
    projects: 3,
  },
  {
    id: "user-002",
    name: "James Carter",
    email: "james.carter@company.com",
    role: "QA_ENGINEER",
    status: "Active",
    avatar: "JC",
    projects: 2,
  },
  {
    id: "user-003",
    name: "Mei Lin Wu",
    email: "mei.wu@company.com",
    role: "QA_ENGINEER",
    status: "Active",
    avatar: "MW",
    projects: 3,
  },
  {
    id: "user-004",
    name: "Raj Patel",
    email: "raj.patel@company.com",
    role: "ADMIN",
    status: "Active",
    avatar: "RP",
    projects: 5,
  },
  {
    id: "user-005",
    name: "Sofia Andersson",
    email: "sofia.andersson@company.com",
    role: "QA_ENGINEER",
    status: "Inactive",
    avatar: "SA",
    projects: 1,
  },
];

// ─── Mock Activities ────────────────────────────────────────────────────────

export const mockActivities: Activity[] = [
  {
    id: "act-001",
    user: "Priya Sharma",
    action: "generated test cases for",
    target: "E-Commerce Platform - Checkout Module",
    timestamp: "2025-06-14T10:23:00Z",
  },
  {
    id: "act-002",
    user: "James Carter",
    action: "approved test case",
    target: "TC-BANK-042: Fund Transfer - Valid Amount",
    timestamp: "2025-06-14T09:45:00Z",
  },
  {
    id: "act-003",
    user: "Mei Lin Wu",
    action: "uploaded document to",
    target: "Healthcare Portal - API Specification v2.3",
    timestamp: "2025-06-13T16:10:00Z",
  },
  {
    id: "act-004",
    user: "Raj Patel",
    action: "updated requirements traceability for",
    target: "Banking Mobile App - Authentication Module",
    timestamp: "2025-06-13T14:32:00Z",
  },
  {
    id: "act-005",
    user: "Priya Sharma",
    action: "created project",
    target: "IoT Dashboard",
    timestamp: "2025-06-12T11:00:00Z",
  },
  {
    id: "act-006",
    user: "James Carter",
    action: "marked test case as failed in",
    target: "HR Management System - Payroll Calculation",
    timestamp: "2025-06-12T09:15:00Z",
  },
];

// ─── Mock Documents ─────────────────────────────────────────────────────────

export const mockDocuments: Document[] = [
  {
    id: "doc-001",
    projectId: "proj-001",
    name: "Checkout_Flow_SRS.pdf",
    type: "PDF",
    size: "2.4 MB",
    status: "Processed",
    uploadedDate: "2025-06-10",
  },
  {
    id: "doc-002",
    projectId: "proj-001",
    name: "Payment_Gateway_Integration_Spec.txt",
    type: "TXT",
    size: "156 KB",
    status: "Processed",
    uploadedDate: "2025-06-11",
  },
  {
    id: "doc-003",
    projectId: "proj-002",
    name: "Mobile_Banking_Requirements_v3.pdf",
    type: "PDF",
    size: "5.1 MB",
    status: "Processed",
    uploadedDate: "2025-05-28",
  },
  {
    id: "doc-004",
    projectId: "proj-003",
    name: "HL7_FHIR_API_Specification.pdf",
    type: "PDF",
    size: "3.8 MB",
    status: "Uploaded",
    uploadedDate: "2025-06-13",
  },
  {
    id: "doc-005",
    projectId: "proj-004",
    name: "HR_Payroll_Rules_Document.pdf",
    type: "PDF",
    size: "1.2 MB",
    status: "Processed",
    uploadedDate: "2025-06-01",
  },
];

// ─── Mock Test Cases ────────────────────────────────────────────────────────

export const mockTestCases: TestCase[] = [
  {
    id: "TC-EC-001",
    projectId: "proj-001",
    title: "Verify successful checkout with valid credit card",
    module: "Checkout",
    priority: "Critical",
    type: "Positive",
    status: "Approved",
    createdDate: "2025-06-10",
    assignedTo: "James Carter",
  },
  {
    id: "TC-EC-002",
    projectId: "proj-001",
    title: "Verify checkout fails with expired credit card",
    module: "Checkout",
    priority: "High",
    type: "Negative",
    status: "Approved",
    createdDate: "2025-06-10",
    assignedTo: "Mei Lin Wu",
  },
  {
    id: "TC-EC-003",
    projectId: "proj-001",
    title: "Verify checkout with maximum items in cart (999 items)",
    module: "Checkout",
    priority: "Medium",
    type: "Edge Case",
    status: "Ready",
    createdDate: "2025-06-11",
    assignedTo: "James Carter",
  },
  {
    id: "TC-BANK-042",
    projectId: "proj-002",
    title: "Verify fund transfer with valid amount and sufficient balance",
    module: "Fund Transfer",
    priority: "Critical",
    type: "Positive",
    status: "Passed",
    createdDate: "2025-06-08",
    assignedTo: "Priya Sharma",
  },
  {
    id: "TC-BANK-043",
    projectId: "proj-002",
    title: "Verify fund transfer fails when amount exceeds daily limit",
    module: "Fund Transfer",
    priority: "High",
    type: "Negative",
    status: "Failed",
    createdDate: "2025-06-08",
    assignedTo: "Mei Lin Wu",
  },
  {
    id: "TC-BANK-044",
    projectId: "proj-002",
    title: "Verify biometric authentication fallback to PIN",
    module: "Authentication",
    priority: "High",
    type: "Edge Case",
    status: "Draft",
    createdDate: "2025-06-12",
    assignedTo: "James Carter",
  },
  {
    id: "TC-HP-010",
    projectId: "proj-003",
    title: "Verify patient appointment booking with available slot",
    module: "Appointments",
    priority: "Critical",
    type: "Positive",
    status: "Approved",
    createdDate: "2025-06-13",
    assignedTo: "Priya Sharma",
  },
  {
    id: "TC-HP-011",
    projectId: "proj-003",
    title: "Verify medical records access denied for unauthorized user",
    module: "Medical Records",
    priority: "Critical",
    type: "Negative",
    status: "Ready",
    createdDate: "2025-06-13",
    assignedTo: "Mei Lin Wu",
  },
  {
    id: "TC-HR-005",
    projectId: "proj-004",
    title: "Verify payroll calculation with overtime hours",
    module: "Payroll",
    priority: "High",
    type: "Positive",
    status: "Failed",
    createdDate: "2025-06-12",
    assignedTo: "James Carter",
  },
  {
    id: "TC-HR-006",
    projectId: "proj-004",
    title: "Verify leave balance deduction for half-day leave",
    module: "Leave Management",
    priority: "Medium",
    type: "Edge Case",
    status: "Draft",
    createdDate: "2025-06-12",
    assignedTo: "Mei Lin Wu",
  },
];

// ─── Mock RTM Entries ───────────────────────────────────────────────────────

export const mockRtmEntries: RtmEntry[] = [
  {
    id: "rtm-001",
    projectId: "proj-001",
    requirementId: "REQ-EC-101",
    requirementTitle: "User shall be able to complete checkout using credit/debit card",
    scenarioId: "SC-EC-101-01",
    testCaseId: "TC-EC-001",
    coverageStatus: "Covered",
    gapAnalysis: "Full coverage — positive and negative payment scenarios are addressed.",
  },
  {
    id: "rtm-002",
    projectId: "proj-001",
    requirementId: "REQ-EC-102",
    requirementTitle: "System shall prevent checkout with expired payment methods",
    scenarioId: "SC-EC-102-01",
    testCaseId: "TC-EC-002",
    coverageStatus: "Covered",
    gapAnalysis: "Expired card rejection is covered. Missing: international card format validation.",
  },
  {
    id: "rtm-003",
    projectId: "proj-002",
    requirementId: "REQ-BANK-201",
    requirementTitle: "User shall transfer funds between own accounts in real-time",
    scenarioId: "SC-BANK-201-01",
    testCaseId: "TC-BANK-042",
    coverageStatus: "Covered",
    gapAnalysis: "Intra-bank transfer covered. Inter-bank transfer via NEFT/RTGS needs separate test cases.",
  },
  {
    id: "rtm-004",
    projectId: "proj-002",
    requirementId: "REQ-BANK-202",
    requirementTitle: "System shall enforce daily transaction limits per user tier",
    scenarioId: "SC-BANK-202-01",
    testCaseId: "TC-BANK-043",
    coverageStatus: "Partial",
    gapAnalysis: "Daily limit enforcement is tested for standard tier. Premium and corporate tier limits are not yet covered.",
  },
  {
    id: "rtm-005",
    projectId: "proj-003",
    requirementId: "REQ-HP-301",
    requirementTitle: "Patient shall book appointments with available healthcare providers",
    scenarioId: "SC-HP-301-01",
    testCaseId: "TC-HP-010",
    coverageStatus: "Covered",
    gapAnalysis: "Standard appointment booking covered. Missing: recurring appointment and waitlist scenarios.",
  },
  {
    id: "rtm-006",
    projectId: "proj-003",
    requirementId: "REQ-HP-302",
    requirementTitle: "System shall restrict medical records access based on role-based permissions",
    scenarioId: "SC-HP-302-01",
    testCaseId: "TC-HP-011",
    coverageStatus: "Not Covered",
    gapAnalysis: "Authorization bypass test case is in Draft status. Needs API-level and UI-level access control tests for doctor, nurse, and admin roles.",
  },
];

// ─── Dashboard Chart Data ───────────────────────────────────────────────────

export const dashboardChartData: DashboardChartData = {
  testCasesByPriority: [
    { name: "Critical", value: 34 },
    { name: "High", value: 58 },
    { name: "Medium", value: 72 },
    { name: "Low", value: 41 },
  ],
  testCasesByStatus: [
    { name: "Draft", value: 28 },
    { name: "Ready", value: 45 },
    { name: "Approved", value: 89 },
    { name: "Passed", value: 67 },
    { name: "Failed", value: 12 },
  ],
  defectsBySeverity: [
    { name: "Critical", value: 5 },
    { name: "High", value: 12 },
    { name: "Medium", value: 23 },
    { name: "Low", value: 18 },
  ],
  monthlyTrend: [
    { month: "Jan", testCases: 45, defects: 8 },
    { month: "Feb", testCases: 62, defects: 11 },
    { month: "Mar", testCases: 58, defects: 14 },
    { month: "Apr", testCases: 91, defects: 9 },
    { month: "May", testCases: 104, defects: 16 },
    { month: "Jun", testCases: 87, defects: 10 },
  ],
  testCasesOverTime: [
    { date: "Week 1", created: 12, approved: 8 },
    { date: "Week 2", created: 18, approved: 14 },
    { date: "Week 3", created: 15, approved: 11 },
    { date: "Week 4", created: 22, approved: 19 },
    { date: "Week 5", created: 28, approved: 21 },
    { date: "Week 6", created: 20, approved: 16 },
  ],
  testCaseDistribution: [
    { name: "Functional", value: 45, fill: "#10b981" },
    { name: "Security", value: 18, fill: "#f59e0b" },
    { name: "Performance", value: 12, fill: "#8b5cf6" },
    { name: "Regression", value: 25, fill: "#3b82f6" },
    { name: "Smoke", value: 8, fill: "#ef4444" },
  ],
  coverageByProject: [
    { project: "E-Commerce", covered: 78, total: 92 },
    { project: "Banking App", covered: 45, total: 68 },
    { project: "CRM System", covered: 32, total: 40 },
    { project: "Healthcare", covered: 56, total: 85 },
  ],
};

// ─── Generation Results ─────────────────────────────────────────────────────

export const generationResults: GenerationResults = {
  requirementAnalysis: [
    {
      id: "ra-001",
      title: "REQ-EC-101: Credit/Debit Card Checkout",
      description:
        "The system must support Visa, MasterCard, and Amex payments during checkout with real-time validation via the payment gateway.",
      category: "Functional",
    },
    {
      id: "ra-002",
      title: "REQ-EC-102: Expired Card Prevention",
      description:
        "All payment methods must be validated for expiration date before initiating the transaction. Expired cards should be rejected with a clear user-facing error message.",
      category: "Security",
    },
    {
      id: "ra-003",
      title: "REQ-EC-103: Order Confirmation Email",
      description:
        "After successful payment, the system shall send an order confirmation email with order ID, item summary, and estimated delivery date within 60 seconds.",
      category: "Non-Functional",
    },
    {
      id: "ra-004",
      title: "REQ-EC-104: Guest Checkout Support",
      description:
        "Users should be able to complete checkout without creating an account. Guest checkout must collect email, shipping address, and payment details.",
      category: "Functional",
    },
  ],

  testScenarios: [
    {
      id: "ts-001",
      title: "SC-EC-101-01: Successful Credit Card Payment",
      description:
        "Navigate to checkout → Enter valid credit card details → Submit payment → Verify order confirmation page displays with correct order total.",
      category: "Happy Path",
    },
    {
      id: "ts-002",
      title: "SC-EC-102-01: Expired Card Rejection",
      description:
        "Navigate to checkout → Enter credit card with past expiration date → Submit payment → Verify error message 'Your card has expired' is displayed.",
      category: "Error Handling",
    },
    {
      id: "ts-003",
      title: "SC-EC-101-02: Payment with Insufficient Funds",
      description:
        "Navigate to checkout → Enter valid card details for a declined transaction → Submit payment → Verify appropriate decline message is shown.",
      category: "Error Handling",
    },
    {
      id: "ts-004",
      title: "SC-EC-103-01: Guest Checkout Flow",
      description:
        "Add item to cart → Proceed to checkout without login → Fill in guest details → Complete payment → Verify confirmation email is sent to the provided address.",
      category: "Happy Path",
    },
  ],

  testCases: [
    {
      id: "tc-gen-001",
      title: "TC-EC-001: Verify successful checkout with Visa credit card",
      description:
        "Given a logged-in user with items in the cart, when they enter a valid Visa card and submit payment, then the order should be confirmed and the order status should change to 'Processing'.",
      category: "Functional",
      severity: "Critical",
    },
    {
      id: "tc-gen-002",
      title: "TC-EC-002: Verify expired MasterCard is rejected at checkout",
      description:
        "Given a user at the payment step, when they enter a MasterCard with an expiration date in the past, then the system should display 'Your card has expired. Please use a valid card.' and prevent submission.",
      category: "Negative",
      severity: "High",
    },
    {
      id: "tc-gen-003",
      title: "TC-EC-003: Verify checkout with multiple payment methods split",
      description:
        "Given a user with an order total of $150, when they split payment between a gift card ($50) and a credit card ($100), then both transactions should be recorded and the order should confirm successfully.",
      category: "Functional",
      severity: "Medium",
    },
    {
      id: "tc-gen-004",
      title: "TC-EC-004: Verify order confirmation email content accuracy",
      description:
        "Given a completed checkout, when the confirmation email is received, then it should contain the correct order ID, list of items with quantities, subtotal, tax, shipping cost, and total amount.",
      category: "Functional",
      severity: "Medium",
    },
  ],

  edgeCases: [
    {
      id: "ec-001",
      title: "EC-EC-001: Checkout with 999 items in cart",
      description:
        "Add the maximum allowed 999 distinct items to the cart and verify the checkout page loads within the performance threshold and the total calculation is accurate.",
      category: "Performance",
      severity: "Medium",
    },
    {
      id: "ec-002",
      title: "EC-EC-002: Payment during server maintenance window",
      description:
        "Initiate a payment when the payment gateway returns a 503 Service Unavailable response. Verify the system retries gracefully and shows a user-friendly error.",
      category: "Resilience",
      severity: "High",
    },
    {
      id: "ec-003",
      title: "EC-EC-003: Checkout with special characters in shipping address",
      description:
        "Enter shipping address fields with Unicode characters, emojis, and extremely long strings (500+ chars) to verify input sanitization and database storage.",
      category: "Security",
      severity: "Medium",
    },
    {
      id: "ec-004",
      title: "EC-EC-004: Simultaneous checkout from two browser tabs",
      description:
        "Open checkout in two tabs for the same user and submit payment simultaneously. Verify only one order is created and inventory is decremented correctly without race conditions.",
      category: "Concurrency",
      severity: "High",
    },
  ],

  apiTestCases: [
    {
      id: "api-001",
      title: "API-TC-001: POST /api/checkout — Valid request payload",
      description:
        "Send a POST request to /api/checkout with a valid cart ID, shipping address, and payment token. Expect HTTP 201 with order ID, status 'confirmed', and estimated delivery date.",
      category: "REST API",
      severity: "Critical",
    },
    {
      id: "api-002",
      title: "API-TC-002: POST /api/checkout — Missing payment token",
      description:
        "Send a POST request to /api/checkout without a payment token. Expect HTTP 400 with error code 'PAYMENT_TOKEN_REQUIRED' and a descriptive message.",
      category: "REST API",
      severity: "High",
    },
    {
      id: "api-003",
      title: "API-TC-003: POST /api/payments/validate — Expired card",
      description:
        "Send a POST request to /api/payments/validate with a card expiration month/year in the past. Expect HTTP 422 with error code 'CARD_EXPIRED'.",
      category: "REST API",
      severity: "High",
    },
    {
      id: "api-004",
      title: "API-TC-004: GET /api/orders/{id} — Order not found",
      description:
        "Send a GET request to /api/orders/non-existent-id. Expect HTTP 404 with error code 'ORDER_NOT_FOUND'. Verify no sensitive data is leaked in the error response.",
      category: "REST API",
      severity: "Medium",
    },
  ],

  databaseTestCases: [
    {
      id: "db-001",
      title: "DB-TC-001: Verify orders table insert on successful checkout",
      description:
        "After a successful checkout, query the orders table and verify a new row is created with correct user_id, total_amount, status='confirmed', and created_at timestamp.",
      category: "Data Integrity",
      severity: "Critical",
    },
    {
      id: "db-002",
      title: "DB-TC-002: Verify inventory decrement on order confirmation",
      description:
        "After order confirmation, verify the products table reflects reduced stock_quantity for each item in the order. Verify stock_quantity never goes negative.",
      category: "Data Integrity",
      severity: "Critical",
    },
    {
      id: "db-003",
      title: "DB-TC-003: Verify payment transaction rollback on failure",
      description:
        "Simulate a payment failure after the order record is created. Verify the orders table entry is rolled back or marked as 'failed' and inventory is restored.",
      category: "Transaction Safety",
      severity: "High",
    },
    {
      id: "db-004",
      title: "DB-TC-004: Verify PII encryption in customer_addresses table",
      description:
        "Query the customer_addresses table and verify that sensitive fields (street_address, phone_number) are encrypted at rest and not readable in plain text.",
      category: "Security",
      severity: "High",
    },
  ],

  bugPrediction: [
    {
      id: "bp-001",
      title: "Predicted: Race condition in concurrent inventory updates",
      description:
        "High probability of inventory overselling when multiple users purchase the same low-stock item simultaneously. The current UPDATE query lacks row-level locking or optimistic concurrency control.",
      category: "Concurrency",
      severity: "Critical",
    },
    {
      id: "bp-002",
      title: "Predicted: Currency rounding error in multi-currency orders",
      description:
        "When converting between currencies during checkout, floating-point arithmetic may cause sub-cent discrepancies between the displayed total and the charged amount, leading to payment gateway rejections.",
      category: "Calculation",
      severity: "High",
    },
    {
      id: "bp-003",
      title: "Predicted: Session timeout during slow payment processing",
      description:
        "If the payment gateway takes longer than the session timeout (30 min), the user's cart may be cleared before the payment callback is received, resulting in an orphaned payment.",
      category: "Session Management",
      severity: "Medium",
    },
    {
      id: "bp-004",
      title: "Predicted: Email confirmation not sent for guest checkouts",
      description:
        "The email service relies on a user_id foreign key. Guest users may not have a user record at the time of email dispatch, causing a silent failure in the confirmation email pipeline.",
      category: "Integration",
      severity: "High",
    },
  ],

  automationRecommendation: [
    {
      id: "ar-001",
      title: "Automate: Checkout happy path end-to-end test",
      description:
        "Create a Playwright/Cypress E2E test covering: login → add to cart → checkout → payment → confirmation. This high-frequency scenario should run on every commit to the main branch.",
      category: "E2E",
      severity: "Critical",
    },
    {
      id: "ar-002",
      title: "Automate: Payment API contract tests",
      description:
        "Implement Pact or similar contract tests for all payment gateway API interactions to catch breaking changes early. Should run in CI/CD pipeline before deployment.",
      category: "Contract Testing",
      severity: "High",
    },
    {
      id: "ar-003",
      title: "Automate: Database seed data validation",
      description:
        "Write a test suite that validates database seed data integrity — referential integrity, required field population, and PII encryption — after every migration run.",
      category: "Data Validation",
      severity: "Medium",
    },
    {
      id: "ar-004",
      title: "Automate: Visual regression for checkout page",
      description:
        "Set up visual regression testing (e.g., Chromatic or Percy) for the checkout flow pages. Capture screenshots across desktop, tablet, and mobile viewports to detect unintended UI changes.",
      category: "Visual Testing",
      severity: "Low",
    },
  ],
};
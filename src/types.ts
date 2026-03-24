export type Role = 'owner' | 'head_teacher' | 'teacher';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  schoolName: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  section: string;
  rollNumber: string;
  admissionDate: string;
  feeAmount: number;
  status: 'active' | 'inactive';
  photoUrl?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  class: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  year: number;
  amountPaid: number;
  totalAmount: number;
  paymentDate: string;
  status: 'paid' | 'partial' | 'pending';
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  salary: number;
  joiningDate: string;
  qualifications: string;
}

export interface Payroll {
  id: string;
  staffId: string;
  month: string;
  year: number;
  baseSalary: number;
  bonus: number;
  deduction: number;
  netPaid: number;
  paymentMethod: 'cash' | 'jazzcash' | 'easypaisa';
  paymentDate: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: 'sick' | 'casual' | 'annual';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Result {
  id: string;
  studentId: string;
  examName: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  date: string;
}

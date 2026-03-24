import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db, storage, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { Toaster, toast } from 'sonner';
import { UserProfile, Role, Student, Attendance, FeeRecord, Staff, Payroll, Expense, LeaveRequest, Result } from './types';
import { cn, formatCurrency, formatDate } from './lib/utils';
import { 
  LayoutDashboard, Users, GraduationCap, Wallet, UserCheck, 
  FileText, Megaphone, Settings, LogOut, Menu, X, 
  Globe, Plus, Search, Download, Trash2, Edit, 
  CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon,
  TrendingUp, Users2, DollarSign, Activity, Camera, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { generateProgressReport, generateSocialMediaPost, generateManagementReport } from './services/geminiService';
import Markdown from 'react-markdown';

// --- Contexts ---
const LanguageContext = createContext<{
  lang: 'en' | 'ur';
  setLang: (l: 'en' | 'ur') => void;
  t: (key: string) => string;
}>({ lang: 'en', setLang: () => {}, t: (s) => s });

const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}>({ user: null, profile: null, loading: true });

// --- Translations ---
const translations = {
  en: {
    dashboard: 'Dashboard',
    academics: 'Academics',
    students: 'Students',
    attendance: 'Attendance',
    results: 'Results',
    finance: 'Finance',
    fees: 'Fees',
    payroll: 'Payroll',
    expenses: 'Expenses',
    staff: 'Staff',
    leaves: 'Leaves',
    aiTools: 'AI Tools',
    reports: 'Reports',
    socialMedia: 'Social Media',
    settings: 'Settings',
    logout: 'Logout',
    welcome: 'Welcome',
    totalStudents: 'Total Students',
    totalTeachers: 'Total Teachers',
    dailyAttendance: 'Daily Attendance',
    feeCollection: 'Fee Collection',
    addStudent: 'Add Student',
    recordPayment: 'Record Payment',
    generateReport: 'Generate Report',
    urdu: 'اردو',
    english: 'English',
    loginWithGoogle: 'Login with Google',
    schoolName: 'The Sepals School System',
    owner: 'Owner',
    headTeacher: 'Head Teacher',
    teacher: 'Teacher',
    save: 'Save',
    cancel: 'Cancel',
    name: 'Name',
    fatherName: 'Father Name',
    class: 'Class',
    rollNo: 'Roll No',
    status: 'Status',
    actions: 'Actions',
    search: 'Search...',
    noData: 'No data found',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Operation successful',
    confirmDelete: 'Are you sure you want to delete this?',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    month: 'Month',
    year: 'Year',
    paid: 'Paid',
    pending: 'Pending',
    partial: 'Partial',
    salary: 'Salary',
    bonus: 'Bonus',
    deduction: 'Deduction',
    netPaid: 'Net Paid',
    paymentMethod: 'Payment Method',
    reason: 'Reason',
    type: 'Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    approve: 'Approve',
    reject: 'Reject',
    generateIDCard: 'Generate ID Card',
    generateResultCard: 'Generate Result Card',
    aiCaption: 'AI Caption',
    socialTemplate: 'Social Template',
    boardReport: 'Board Report',
    uploadPhoto: 'Upload Photo',
    edit: 'Edit',
    feeAmount: 'Fee Amount',
    section: 'Section',
    info: 'Info',
    present: 'Present',
    absent: 'Absent',
    leave: 'Leave',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    academics: 'تعلیمی امور',
    students: 'طلباء',
    attendance: 'حاضری',
    results: 'نتائج',
    finance: 'مالیات',
    fees: 'فیس',
    payroll: 'تنخواہیں',
    expenses: 'اخراجات',
    staff: 'عملہ',
    leaves: 'رخصت',
    aiTools: 'مصنوعی ذہانت کے ٹولز',
    reports: 'رپورٹس',
    socialMedia: 'سوشل میڈیا',
    settings: 'ترتیبات',
    logout: 'لاگ آؤٹ',
    welcome: 'خوش آمدید',
    totalStudents: 'کل طلباء',
    totalTeachers: 'کل اساتذہ',
    dailyAttendance: 'روزانہ حاضری',
    feeCollection: 'فیس کی وصولی',
    addStudent: 'طالب علم شامل کریں',
    recordPayment: 'ادائیگی درج کریں',
    generateReport: 'رپورٹ تیار کریں',
    urdu: 'اردو',
    english: 'English',
    loginWithGoogle: 'گوگل کے ساتھ لاگ ان کریں',
    schoolName: 'دی سیپلز اسکول سسٹم',
    owner: 'مالک',
    headTeacher: 'ہیڈ ٹیچر',
    teacher: 'استاد',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    name: 'نام',
    fatherName: 'والد کا نام',
    class: 'کلاس',
    rollNo: 'رول نمبر',
    status: 'حالت',
    actions: 'اقدامات',
    search: 'تلاش کریں...',
    noData: 'کوئی ڈیٹا نہیں ملا',
    loading: 'لوڈنگ ہو رہی ہے...',
    error: 'ایک غلطی پیش آگئی',
    success: 'آپریشن کامیاب رہا',
    confirmDelete: 'کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟',
    amount: 'رقم',
    date: 'تاریخ',
    category: 'قسم',
    description: 'تفصیل',
    month: 'مہینہ',
    year: 'سال',
    paid: 'ادا شدہ',
    pending: 'زیر التواء',
    partial: 'جزوی',
    salary: 'تنخواہ',
    bonus: 'بونس',
    deduction: 'کٹوتی',
    netPaid: 'کل ادائیگی',
    paymentMethod: 'ادائیگی کا طریقہ',
    reason: 'وجہ',
    type: 'قسم',
    startDate: 'شروع ہونے کی تاریخ',
    endDate: 'ختم ہونے کی تاریخ',
    approve: 'منظور کریں',
    reject: 'مسترد کریں',
    generateIDCard: 'شناختی کارڈ تیار کریں',
    generateResultCard: 'رزلٹ کارڈ تیار کریں',
    aiCaption: 'اے آئی کیپشن',
    socialTemplate: 'سوشل ٹیمپلیٹ',
    boardReport: 'بورڈ رپورٹ',
    uploadPhoto: 'تصویر اپ لوڈ کریں',
    edit: 'ترمیم کریں',
    feeAmount: 'فیس کی رقم',
    section: 'سیکشن',
    info: 'معلومات',
    present: 'حاضر',
    absent: 'غیر حاضر',
    leave: 'رخصت',
    january: 'جنوری',
    february: 'فروری',
    march: 'مارچ',
    april: 'اپریل',
    may: 'مئی',
    june: 'جون',
    july: 'جولائی',
    august: 'اگست',
    september: 'ستمبر',
    october: 'اکتوبر',
    november: 'نومبر',
    december: 'دسمبر',
  }
};

// --- Components ---

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<'en' | 'ur'>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'en' || saved === 'ur') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => {
    return (translations[lang] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Default profile for new users (Owner by default for first user, or prompt for role)
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            role: 'owner', // In a real app, this would be more controlled
            schoolName: 'The Sepals School System',
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useContext(AuthContext);
  const { lang, setLang, t } = useContext(LanguageContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'dashboard', icon: LayoutDashboard, path: '/', roles: ['owner', 'head_teacher', 'teacher'] },
    { name: 'students', icon: GraduationCap, path: '/students', roles: ['owner', 'head_teacher', 'teacher'] },
    { name: 'attendance', icon: UserCheck, path: '/attendance', roles: ['owner', 'head_teacher', 'teacher'] },
    { name: 'results', icon: FileText, path: '/results', roles: ['owner', 'head_teacher', 'teacher'] },
    { name: 'fees', icon: Wallet, path: '/fees', roles: ['owner', 'head_teacher'] },
    { name: 'payroll', icon: DollarSign, path: '/payroll', roles: ['owner'] },
    { name: 'expenses', icon: TrendingUp, path: '/expenses', roles: ['owner'] },
    { name: 'staff', icon: Users2, path: '/staff', roles: ['owner', 'head_teacher'] },
    { name: 'leaves', icon: Clock, path: '/leaves', roles: ['owner', 'head_teacher', 'teacher'] },
    { name: 'aiTools', icon: Megaphone, path: '/ai-tools', roles: ['owner', 'head_teacher', 'teacher'] },
  ];

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className={cn("min-h-screen bg-neutral-100 flex", lang === 'ur' ? "font-urdu" : "font-sans")}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-50 w-64 bg-neutral-900 text-white transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
        lang === 'ur' ? "right-0 translate-x-full" : "left-0 -translate-x-full",
        isSidebarOpen && "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">{t('schoolName')}</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === item.path 
                    ? "bg-neutral-800 text-white" 
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", lang === 'ur' ? "ml-3" : "mr-3")} />
                {t(item.name)}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-neutral-800">
            <div className="flex items-center px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center mr-3">
                <Users className="w-6 h-6 text-neutral-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.displayName}</p>
                <p className="text-xs text-neutral-500 truncate">{t(profile?.role || '')}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              <LogOut className={cn("w-5 h-5", lang === 'ur' ? "ml-3" : "mr-3")} />
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-bottom border-neutral-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-neutral-500 hover:text-neutral-900">
            <Menu size={24} />
          </button>
          
          <div className="flex-1 px-4">
            <h2 className="text-lg font-semibold text-neutral-900 lg:hidden">{t('schoolName')}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
            >
              <Globe className={cn("w-4 h-4", lang === 'ur' ? "ml-2" : "mr-2")} />
              {lang === 'en' ? 'اردو' : 'English'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// --- Pages ---

const Login = () => {
  const { t } = useContext(LanguageContext);
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
      >
        <div className="w-20 h-20 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('schoolName')}</h1>
        <p className="text-neutral-500 mb-8">Management Information System</p>
        
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full flex items-center justify-center px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-3" alt="Google" />
          {t('loginWithGoogle')}
        </button>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useContext(LanguageContext);
  const { profile } = useContext(AuthContext);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    attendance: 0,
    fees: 0
  });

  useEffect(() => {
    // Real-time stats
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => setStats(prev => ({ ...prev, students: snap.size })));
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => setStats(prev => ({ ...prev, teachers: snap.size })));
    // Add more listeners for attendance and fees...
    return () => { unsubStudents(); unsubStaff(); };
  }, []);

  const cards = [
    { name: 'totalStudents', value: stats.students, icon: Users, color: 'bg-blue-500' },
    { name: 'totalTeachers', value: stats.teachers, icon: Users2, color: 'bg-green-500' },
    { name: 'dailyAttendance', value: '92%', icon: UserCheck, color: 'bg-purple-500' },
    { name: 'feeCollection', value: formatCurrency(125000), icon: Wallet, color: 'bg-orange-500' },
  ];

  const navigate = useNavigate();

  const quickActions = [
    { name: 'addStudent', icon: Plus, path: '/students', state: { openModal: true }, color: 'bg-neutral-900' },
    { name: 'recordAttendance', icon: UserCheck, path: '/attendance', color: 'bg-neutral-100 text-neutral-900' },
    { name: 'recordPayment', icon: DollarSign, path: '/fees', state: { openModal: true }, color: 'bg-neutral-100 text-neutral-900' },
    { name: 'generateReport', icon: FileText, path: '/ai-tools', color: 'bg-neutral-100 text-neutral-900' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('welcome')}, {profile?.displayName}</h1>
          <p className="text-neutral-500">{t('schoolName')} - {t(profile?.role || '')}</p>
        </div>
        <div className="flex space-x-3">
          {quickActions.map(action => (
            <button
              key={action.name}
              onClick={() => navigate(action.path, { state: action.state })}
              className={cn(
                "hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95",
                action.color
              )}
            >
              <action.icon size={18} className="mr-2" />
              {t(action.name)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex items-center"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mr-4", card.color)}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{t(card.name)}</p>
              <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Activity className="mr-2 text-neutral-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New student enrolled: Muhammad Ali</p>
                  <p className="text-xs text-neutral-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Megaphone className="mr-2 text-neutral-400" />
            AI Announcements
          </h3>
          <div className="p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            <p className="text-sm text-neutral-600 italic">"Eid-ul-Fitr holidays will start from next Monday. The school will reopen on Thursday. Eid Mubarak to all parents and students!"</p>
            <div className="mt-4 flex space-x-2">
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Eid-ul-Fitr holidays will start from next Monday. The school will reopen on Thursday. Eid Mubarak to all parents and students!")}`)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Share on WhatsApp
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("عید الفطر کی چھٹیاں اگلے پیر سے شروع ہوں گی۔ اسکول جمعرات کو دوبارہ کھلے گا۔ تمام والدین اور طلباء کو عید مبارک!");
                  alert("Urdu text copied to clipboard!");
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Copy Urdu Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentModal = ({ isOpen, onClose, student = null }: { isOpen: boolean; onClose: () => void; student?: Student | null }) => {
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    class: '',
    section: '',
    rollNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    feeAmount: 0,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        fatherName: student.fatherName,
        class: student.class,
        section: student.section,
        rollNumber: student.rollNumber,
        admissionDate: student.admissionDate,
        feeAmount: student.feeAmount,
        status: student.status
      });
      setPhotoPreview(student.photoUrl || null);
    } else {
      setFormData({
        name: '',
        fatherName: '',
        class: '',
        section: '',
        rollNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
        feeAmount: 0,
        status: 'active'
      });
      setPhotoPreview(null);
      setPhoto(null);
    }
  }, [student, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoUrl = student?.photoUrl || '';
      if (photo) {
        const storageRef = ref(storage, `students/${Date.now()}_${photo.name}`);
        const snapshot = await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      if (student) {
        await updateDoc(doc(db, 'students', student.id), {
          ...formData,
          photoUrl,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'students'), {
          ...formData,
          photoUrl,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
      toast.success(student ? t('success') : t('addStudent'));
    } catch (error) {
      console.error('Student submission error:', error);
      toast.error(t('error'));
      handleFirestoreError(error, OperationType.WRITE, 'students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{student ? t('edit') : t('addStudent')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden group">
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <Camera className="w-8 h-8 text-neutral-400" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                    <Plus size={20} className="mb-1" />
                    {t('uploadPhoto')}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                      ref={fileInputRef}
                    />
                  </label>
                </div>
                {!photoPreview && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-widest"
                  >
                    {t('uploadPhoto')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('name')}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('fatherName')}</label>
                  <input
                    required
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('class')}</label>
                  <input
                    required
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('section')}</label>
                  <input
                    required
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('rollNo')}</label>
                  <input
                    required
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('feeAmount')}</label>
                  <input
                    required
                    type="number"
                    value={formData.feeAmount}
                    onChange={(e) => setFormData({ ...formData, feeAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {loading ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StudentProfileModal = ({ student, isOpen, onClose, onEdit, onGenerateIDCard }: { student: Student | null; isOpen: boolean; onClose: () => void; onEdit: (s: Student) => void; onGenerateIDCard: (s: Student) => void }) => {
  const { t } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'fees' | 'results'>('info');
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [feeHistory, setFeeHistory] = useState<FeeRecord[]>([]);
  const [resultHistory, setResultHistory] = useState<Result[]>([]);

  useEffect(() => {
    if (isOpen && student) {
      // Fetch Attendance
      const attQuery = query(collection(db, 'attendance'), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(10));
      const unsubAtt = onSnapshot(attQuery, (snap) => {
        setAttendanceHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      });

      // Fetch Fees
      const feeQuery = query(collection(db, 'fees'), where('studentId', '==', student.id), orderBy('paymentDate', 'desc'));
      const unsubFee = onSnapshot(feeQuery, (snap) => {
        setFeeHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeRecord)));
      });

      // Fetch Results
      const resQuery = query(collection(db, 'results'), where('studentId', '==', student.id), orderBy('date', 'desc'));
      const unsubRes = onSnapshot(resQuery, (snap) => {
        setResultHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
      });

      return () => {
        unsubAtt();
        unsubFee();
        unsubRes();
      };
    }
  }, [isOpen, student]);

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `students/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, 'students', student.id), {
        photoUrl,
        updatedAt: new Date().toISOString()
      });
      toast.success(t('success'));
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(t('error'));
      handleFirestoreError(error, OperationType.WRITE, 'students');
    } finally {
      setUploading(false);
    }
  };

  if (!student) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="relative h-32 bg-neutral-900 shrink-0">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors z-10">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 pb-6 overflow-y-auto">
              <div className="relative -mt-16 mb-4 flex justify-center">
                <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-lg">
                  <div className="w-full h-full rounded-[28px] bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={48} className="text-neutral-300" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                    <Camera size={20} className="mb-1" />
                    {t('uploadPhoto')}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">{student.name}</h2>
                <p className="text-neutral-500">{t('rollNo')}: {student.rollNumber}</p>
              </div>

              <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl mb-6">
                {(['info', 'attendance', 'fees', 'results'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                      activeTab === tab ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    {t(tab)}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-500">{t('fatherName')}</span>
                    <span className="text-sm font-semibold">{student.fatherName}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-500">{t('class')}</span>
                    <span className="text-sm font-semibold">{student.class} ({student.section})</span>
                  </div>
                  <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-500">{t('status')}</span>
                    <span className={cn(
                      "text-xs font-bold uppercase px-2 py-1 rounded-full",
                      student.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {student.status}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-500">{t('feeAmount')}</span>
                    <span className="text-sm font-semibold">{formatCurrency(student.feeAmount)}</span>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <span className="text-sm font-medium">{formatDate(att.date)}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          att.status === 'present' ? "bg-green-100 text-green-700" : att.status === 'absent' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {t(att.status)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-500 py-4">{t('noData')}</p>
                  )}
                </div>
              )}

              {activeTab === 'fees' && (
                <div className="space-y-3">
                  {feeHistory.length > 0 ? (
                    feeHistory.map(fee => (
                      <div key={fee.id} className="p-3 bg-neutral-50 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{fee.month} {fee.year}</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            fee.status === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {t(fee.status)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500">
                          <span>{formatCurrency(fee.amountPaid)} / {formatCurrency(fee.totalAmount)}</span>
                          <span>{formatDate(fee.paymentDate)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-500 py-4">{t('noData')}</p>
                  )}
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-3">
                  {resultHistory.length > 0 ? (
                    resultHistory.map(res => (
                      <div key={res.id} className="p-3 bg-neutral-50 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{res.subject}</span>
                          <span className="text-xs font-medium text-neutral-500">{res.examName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-neutral-500">{formatDate(res.date)}</span>
                          <span className="text-sm font-bold text-neutral-900">
                            {res.marksObtained} / {res.totalMarks} ({Math.round((res.marksObtained / res.totalMarks) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-500 py-4">{t('noData')}</p>
                  )}
                </div>
              )}

              <div className="mt-8 flex space-x-2">
              <button 
                onClick={() => { 
                  console.log('Editing student:', student.name);
                  onEdit(student); 
                  onClose(); 
                }}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                {t('edit')}
              </button>
                <button className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors">
                  <FileText size={16} className="mr-2" />
                  {t('reports')}
                </button>
                <button 
                  onClick={() => onGenerateIDCard(student)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
                >
                  <FileText size={16} className="mr-2" />
                  {t('generateIDCard')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const IDCardModal = ({ student, isOpen, onClose }: { student: Student | null; isOpen: boolean; onClose: () => void }) => {
  const { t } = useContext(LanguageContext);
  const [downloading, setDownloading] = useState(false);
  if (!student) return null;

  const handleDownload = async () => {
    const element = document.getElementById('id-card');
    if (!element) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `ID_Card_${student.rollNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(t('success'));
    } catch (error) {
      console.error('ID Card download error:', error);
      toast.error(t('error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('generateIDCard')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div id="id-card" className="w-full aspect-[2/3] bg-white border-2 border-neutral-900 rounded-2xl overflow-hidden flex flex-col shadow-lg relative">
                {/* Header */}
                <div className="bg-neutral-900 text-white p-4 text-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest">{t('schoolName')}</h3>
                  <p className="text-[10px] opacity-70">Identity Card</p>
                </div>

                {/* Photo */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-32 h-32 rounded-2xl bg-neutral-100 border-2 border-neutral-900 overflow-hidden flex items-center justify-center">
                    {student.photoUrl ? (
                      <img 
                        src={student.photoUrl} 
                        alt={student.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Users size={48} className="text-neutral-300" />
                    )}
                  </div>

                  <div className="text-center space-y-1">
                    <h4 className="text-lg font-bold text-neutral-900 uppercase">{student.name}</h4>
                    <p className="text-xs font-bold text-neutral-500">{t('rollNo')}: {student.rollNumber}</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold">{t('class')}</p>
                      <p className="text-xs font-bold">{student.class} ({student.section})</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold">{t('fatherName')}</p>
                      <p className="text-xs font-bold">{student.fatherName}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-neutral-50 p-3 text-center border-t border-neutral-100">
                  <p className="text-[10px] font-bold text-neutral-400">Valid until: March 2027</p>
                </div>
              </div>

              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="mt-8 w-full flex items-center justify-center px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                {downloading ? t('loading') : t('download')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Students = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const updatedStudents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(updatedStudents);
      
      // Keep selected student in sync
      if (selectedStudent) {
        const updated = updatedStudents.find(s => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    });
    return unsub;
  }, [selectedStudent?.id]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber.includes(searchTerm)
  );

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(false); // Close profile modal if open
    setIsModalOpen(true);
  };

  const handleGenerateIDCard = (student: Student) => {
    setSelectedStudent(student);
    setIsIDCardModalOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        toast.success(t('success'));
      } catch (error) {
        console.error('Delete student error:', error);
        toast.error(t('error'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">{t('students')}</h1>
        <button 
          onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }}
          className="flex items-center justify-center px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('addStudent')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border-none rounded-lg focus:ring-2 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('name')}</th>
                <th className="px-6 py-4 font-semibold">{t('class')}</th>
                <th className="px-6 py-4 font-semibold">{t('rollNo')}</th>
                <th className="px-6 py-4 font-semibold">{t('status')}</th>
                <th className="px-6 py-4 font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mr-3 overflow-hidden">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                        <p className="text-xs text-neutral-500">{student.fatherName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{student.class}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{student.rollNumber}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-semibold rounded-full",
                      student.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewProfile(student)}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors" 
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(student)}
                        className="text-neutral-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleGenerateIDCard(student)}
                        className="text-neutral-400 hover:text-green-600 transition-colors" 
                        title={t('generateIDCard')}
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-neutral-500">{t('noData')}</div>
          )}
        </div>
      </div>

      <StudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        student={selectedStudent}
      />
      <StudentProfileModal 
        student={selectedStudent} 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onEdit={handleEdit}
        onGenerateIDCard={handleGenerateIDCard}
      />
      <IDCardModal 
        isOpen={isIDCardModalOpen} 
        onClose={() => setIsIDCardModalOpen(false)} 
        student={selectedStudent}
      />
    </div>
  );
};

const AITools = () => {
  const { t, lang } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<'report' | 'social' | 'board'>('report');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let res = '';
      if (activeTab === 'report') {
        res = await generateProgressReport('Student', input, lang);
      } else if (activeTab === 'social') {
        res = await generateSocialMediaPost(input, lang);
      } else if (activeTab === 'board') {
        // Fetch stats for the selected month/year
        const studentsSnap = await getDocs(collection(db, 'students'));
        const staffSnap = await getDocs(collection(db, 'staff'));
        const feesSnap = await getDocs(query(
          collection(db, 'fees'), 
          where('month', '==', selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)), 
          where('year', '==', parseInt(selectedYear))
        ));
        const expensesSnap = await getDocs(collection(db, 'expenses'));

        const stats = {
          month: selectedMonth,
          year: selectedYear,
          totalStudents: studentsSnap.size,
          totalStaff: staffSnap.size,
          feesCollected: feesSnap.docs.reduce((acc, doc) => acc + (doc.data().amountPaid || 0), 0),
          expenses: expensesSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0),
          additionalNotes: input
        };

        res = await generateManagementReport(stats, lang);
      }
      setOutput(res);
    } catch (e) {
      console.error(e);
      alert(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t('aiTools')}</h1>

      <div className="flex space-x-4 border-b border-neutral-200">
        {(['report', 'social', 'board'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setOutput(''); setInput(''); }}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all border-b-2",
              activeTab === tab ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            {t(tab === 'report' ? 'reports' : tab === 'social' ? 'socialMedia' : 'boardReport')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            {activeTab === 'board' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">{t('month')}</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    {months.map(m => (
                      <option key={m} value={m}>{t(m)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">{t('year')}</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {activeTab === 'report' ? 'Enter student performance details' : 
               activeTab === 'social' ? 'Enter event details (e.g. Eid, Teachers Day)' : 
               'Enter any specific notes for the board report'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-40 p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all resize-none"
              placeholder="Type here..."
            />
            <button
              onClick={handleGenerate}
              disabled={loading || (activeTab !== 'board' && !input)}
              className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {loading ? t('loading') : t('generateReport')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Output</h3>
            {output && (
              <button className="text-neutral-500 hover:text-neutral-900 transition-colors">
                <Download size={20} />
              </button>
            )}
          </div>
          {output ? (
            <div className="prose prose-neutral max-w-none">
              <Markdown>{output}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-4">
              <Megaphone size={48} strokeWidth={1} />
              <p>{t('noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const { t } = useContext(LanguageContext);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [existingAttendanceIds, setExistingAttendanceIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, 'students'), where('class', '==', selectedClass), where('status', '==', 'active'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return unsub;
  }, [selectedClass]);

  useEffect(() => {
    const fetchAttendance = async () => {
      const q = query(
        collection(db, 'attendance'), 
        where('class', '==', selectedClass), 
        where('date', '==', selectedDate)
      );
      const snap = await getDocs(q);
      const newAttendance: Record<string, 'present' | 'absent' | 'leave'> = {};
      const newIds: Record<string, string> = {};
      snap.docs.forEach(doc => {
        const data = doc.data() as Attendance;
        newAttendance[data.studentId] = data.status;
        newIds[data.studentId] = doc.id;
      });
      setAttendance(newAttendance);
      setExistingAttendanceIds(newIds);
    };
    fetchAttendance();
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'leave') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, 'present' | 'absent' | 'leave'> = { ...attendance };
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Iterate over all students in the selected class
      for (const student of students) {
        const studentId = student.id;
        const status = attendance[studentId] || 'present'; // Default to present if not marked
        const existingId = existingAttendanceIds[studentId];
        
        if (existingId) {
          const docRef = doc(db, 'attendance', existingId);
          batch.update(docRef, { 
            status, 
            updatedAt: new Date().toISOString() 
          });
        } else {
          const docRef = doc(collection(db, 'attendance'));
          batch.set(docRef, {
            studentId,
            date: selectedDate,
            status,
            class: selectedClass,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      await batch.commit();
      toast.success(t('success'));
      
      // Refresh IDs after save
      const q = query(
        collection(db, 'attendance'), 
        where('class', '==', selectedClass), 
        where('date', '==', selectedDate)
      );
      const snap = await getDocs(q);
      const newIds: Record<string, string> = {};
      snap.docs.forEach(doc => {
        const data = doc.data() as Attendance;
        newIds[data.studentId] = doc.id;
      });
      setExistingAttendanceIds(newIds);
    } catch (error) {
      console.error('Save attendance error:', error);
      toast.error(t('error'));
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">{t('attendance')}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900"
          />
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900"
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
          <button 
            onClick={markAllPresent}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
          >
            {t('markAllPresent') || 'Mark All Present'}
          </button>
          <button 
            onClick={saveAttendance}
            disabled={loading}
            className="px-6 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
            {t('save')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('name')}</th>
                <th className="px-6 py-4 font-semibold">{t('rollNo')}</th>
                <th className="px-6 py-4 font-semibold">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3 overflow-hidden">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-neutral-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{student.rollNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {(['present', 'absent', 'leave'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                            attendance[student.id] === status 
                              ? (status === 'present' ? "bg-green-500 text-white" : status === 'absent' ? "bg-red-500 text-white" : "bg-orange-500 text-white")
                              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                          )}
                        >
                          {t(status)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-neutral-500">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RecordPaymentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: 0,
    month: new Date().toLocaleString('en-US', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'bank' | 'online'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const student = students.find(s => s.id === formData.studentId);
      await addDoc(collection(db, 'fees'), {
        ...formData,
        year: parseInt(formData.year),
        studentName: student?.name || '',
        status: 'paid',
        totalAmount: student?.feeAmount || 0,
        amountPaid: formData.amount,
        createdAt: new Date().toISOString()
      });
      onClose();
      toast.success(t('success'));
    } catch (error) {
      console.error(error);
      toast.error(t('error'));
      handleFirestoreError(error, OperationType.WRITE, 'fees');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('recordPayment')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">{t('student')}</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => {
                    const s = students.find(st => st.id === e.target.value);
                    setFormData({ ...formData, studentId: e.target.value, amount: s?.feeAmount || 0 });
                  }}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('amount')}</label>
                  <input
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('paymentMethod')}</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('month')}</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('year')}</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {loading ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Finance = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'fees' | 'payroll' | 'expenses'>('fees');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);

  useEffect(() => {
    if (location.state?.openModal) {
      setIsPaymentModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'fees'), orderBy('paymentDate', 'desc'), limit(50)), (snap) => {
      setFeeRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeRecord)));
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t('finance')}</h1>
      
      <div className="flex space-x-4 border-b border-neutral-200">
        {(['fees', 'payroll', 'expenses'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all border-b-2",
              activeTab === tab ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{t('feeCollection')}</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                {t('recordPayment')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase">{t('paid')}</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(feeRecords.reduce((acc, curr) => acc + curr.amountPaid, 0))}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-bold uppercase">{t('partial')}</p>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(0)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600 font-bold uppercase">{t('pending')}</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-neutral-500 uppercase">
                  <tr>
                    <th className="py-3">{t('student')}</th>
                    <th className="py-3">{t('month')}</th>
                    <th className="py-3">{t('amount')}</th>
                    <th className="py-3">{t('date')}</th>
                    <th className="py-3">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {feeRecords.map(record => (
                    <tr key={record.id}>
                      <td className="py-3 text-sm font-medium">{record.studentName}</td>
                      <td className="py-3 text-sm">{record.month} {record.year}</td>
                      <td className="py-3 text-sm font-bold">{formatCurrency(record.amountPaid)}</td>
                      <td className="py-3 text-sm text-neutral-500">{formatDate(record.paymentDate)}</td>
                      <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{t(record.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{t('payroll')}</h3>
              <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium">Pay Salaries</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-neutral-500 uppercase">
                  <tr>
                    <th className="py-3">{t('name')}</th>
                    <th className="py-3">{t('salary')}</th>
                    <th className="py-3">{t('status')}</th>
                    <th className="py-3">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[1, 2, 3].map(i => (
                    <tr key={i}>
                      <td className="py-3 text-sm font-medium">Teacher {i}</td>
                      <td className="py-3 text-sm">{formatCurrency(35000)}</td>
                      <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{t('paid')}</span></td>
                      <td className="py-3 text-sm text-neutral-500">Mar 10, 2026</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{t('expenses')}</h3>
              <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium">Add Expense</button>
            </div>
            <div className="space-y-3">
              {[
                { cat: 'Utilities', amt: 12000, desc: 'Electricity Bill' },
                { cat: 'Supplies', amt: 5000, desc: 'Stationery' },
                { cat: 'Transport', amt: 25000, desc: 'Fuel for Van' }
              ].map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold">{exp.cat}</p>
                    <p className="text-xs text-neutral-500">{exp.desc}</p>
                  </div>
                  <p className="font-bold text-red-600">-{formatCurrency(exp.amt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <RecordPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
    </div>
  );
};

const AddStaffModal = ({ isOpen, onClose, staff = null }: { isOpen: boolean; onClose: () => void; staff?: Staff | null }) => {
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'teacher',
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    qualifications: ''
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        salary: staff.salary,
        joiningDate: staff.joiningDate,
        qualifications: staff.qualifications
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'teacher',
        salary: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        qualifications: ''
      });
    }
  }, [staff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting staff form:', formData);
    try {
      if (staff) {
        await updateDoc(doc(db, 'staff', staff.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const docRef = await addDoc(collection(db, 'staff'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        console.log('Staff added with ID:', docRef.id);
      }
      onClose();
      toast.success(staff ? t('success') : t('addStaff'));
    } catch (error) {
      console.error('Staff submission error:', error);
      toast.error(t('error'));
      handleFirestoreError(error, OperationType.WRITE, 'staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{staff ? t('edit') : t('addStaff')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">{t('name')}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">{t('email')}</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('role')}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    <option value="teacher">{t('teacher')}</option>
                    <option value="head_teacher">{t('headTeacher')}</option>
                    <option value="admin">{t('admin')}</option>
                    <option value="clerk">{t('clerk')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">{t('salary')}</label>
                  <input
                    required
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">{t('qualifications')}</label>
                <input
                  required
                  type="text"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 transition-all"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {loading ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StaffPage = () => {
  const { t } = useContext(LanguageContext);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snap) => {
      setStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    return unsub;
  }, []);

  const handleDelete = async (staffId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'staff', staffId));
        toast.success(t('success'));
      } catch (error) {
        console.error('Delete staff error:', error);
        toast.error(t('error'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t('staff')}</h1>
        <button 
          onClick={() => { setSelectedStaff(null); setIsAddModalOpen(true); }}
          className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
        >
          {t('addStaff')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mr-4">
                <Users2 className="text-neutral-400" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">{member.name}</h3>
                <p className="text-xs text-neutral-500">{t(member.role)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <p className="flex justify-between"><span>{t('salary')}:</span> <span className="font-medium">{formatCurrency(member.salary)}</span></p>
              <p className="flex justify-between"><span>{t('joined')}:</span> <span className="font-medium">{formatDate(member.joiningDate)}</span></p>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 flex space-x-2">
              <button 
                onClick={() => { setSelectedStaff(member); setIsAddModalOpen(true); }}
                className="flex-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                {t('edit')}
              </button>
              <button 
                onClick={() => handleDelete(member.id)}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <button className="flex-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors">{t('salarySlip')}</button>
            </div>
          </div>
        ))}
      </div>

      <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} staff={selectedStaff} />
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <AuthConsumer />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

const AuthConsumer = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
    </div>
  );

  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/fees" element={<Finance />} />
        <Route path="/payroll" element={<Finance />} />
        <Route path="/expenses" element={<Finance />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

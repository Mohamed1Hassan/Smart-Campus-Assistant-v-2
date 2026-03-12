import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to map day names to integers (0-6)
const dayMap: { [key: string]: number } = {
    'الأحد': 0,
    'الاثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6,
};

// Data interfaces
interface ScheduleData {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    professorName: string;
    type: 'Lecture' | 'Section';
}

interface CourseData {
    name: string;
    code: string; // We will generate this
    schedules: ScheduleData[];
}

interface LevelData {
    level: number;
    courses: CourseData[];
}

interface MajorData {
    name: string;
    code: string;
    levels: LevelData[];
}

// Helper function to create/update professor
// Global counter for professor IDs
let professorIdCounter = 10000001;

async function upsertProfessor(name: string) {
    // Generate a unique email based on the name to ensure idempotency
    // Remove titles like "د.", "أ.د", "م.", "م.م" for the email
    const cleanName = name.replace(/^(أ\.د|د\.|م\.م|م\.|أ\.)\s*/, '').trim();
    // Simple transliteration for email (Arabic to English approximation could be complex, 
    // so we'll use a generic email format with the ID to guarantee uniqueness and valid format)
    const email = `professor.${professorIdCounter}@smartcampus.edu`;

    // Try to find existing user by name
    const existingUser = await prisma.user.findFirst({
        where: { name: name },
    });

    if (existingUser) {
        // Force update password to '123456' and log the ID
        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: existingUser.id },
            data: { password: hashedPassword }
        });
        console.log(`  - Professor verified: ${name} (ID: ${existingUser.universityId})`);
        return existingUser;
    }

    const currentId = professorIdCounter.toString();
    professorIdCounter++;

    // Create new professor
    // Password is '123456' hashed with bcrypt
    const hashedPassword = await bcrypt.hash('123456', 10);

    return await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword,
            universityId: currentId,
            firstName: cleanName.split(' ')[0],
            lastName: cleanName.split(' ').slice(1).join(' ') || 'Professor',
            role: UserRole.PROFESSOR,
        },
    });
}

// Main data array (will be populated in subsequent steps)
const majorsData: MajorData[] = [
    {
        name: 'Information Systems',
        code: 'IS',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'Foreign Language (1)',
                        code: 'IS101',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'S101', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '10:00', room: 'A406', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '10:00', room: 'A501', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A501', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A408', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A201', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A202', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A503', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A206', professorName: 'م. هبة أشرف أحمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Business Administration',
                        code: 'IS102',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'S101', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Mathematics',
                        code: 'IS103',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A202', professorName: 'أ.م.د حسن صلاح محمد الدسوقي', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A202', professorName: 'أ.م.د حسن صلاح محمد الدسوقي', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Financial Accounting',
                        code: 'IS104',
                        schedules: [
                            { day: 'الخميس', startTime: '10:00', endTime: '13:00', room: 'S201', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الخميس', startTime: '13:00', endTime: '16:00', room: 'S101', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'A403', professorName: 'م. أماني إمام محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'A503', professorName: 'م. محمد احمد عفيفي', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '10:00', room: 'A502', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A406', professorName: 'م. أماني إمام محمد', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A502', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A201', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'S101', professorName: 'م. جالا محمد علي', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'S201', professorName: 'م. محمد احمد عفيفي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Psychology',
                        code: 'IS105',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. عمرو محمد ابراهيم محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Human Rights',
                        code: 'IS106',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '14:30', room: 'A301', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Law',
                        code: 'IS107',
                        schedules: [
                            { day: 'الخميس', startTime: '10:00', endTime: '13:00', room: 'S101', professorName: 'د. محمود الزهيري', type: 'Lecture' },
                            { day: 'الخميس', startTime: '13:00', endTime: '16:00', room: 'S201', professorName: 'د. محمود الزهيري', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Logistics & Supply Chain Management',
                        code: 'IS201',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'د. احمد محمد حسن عبد الجواد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Marketing',
                        code: 'IS202',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A202', professorName: 'د. ماجدة محمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Cost Accounting',
                        code: 'IS203',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. مصطفى نصر الدين أحمد', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A202', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A406', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A304', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A403', professorName: 'م. محمد احمد عفيفي محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A304', professorName: 'م. أماني إمام محمد محمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Microeconomics',
                        code: 'IS204',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'د. عزت عبد الله عبد الحليم', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A402', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A402', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'B103', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'B108', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A503', professorName: 'م. امير سلطان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Production & Operations Management',
                        code: 'IS205',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'S101', professorName: 'د. احمد محمد حسن عبد الجواد', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'B202', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'B108', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A503', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A304', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A403', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Analytics',
                        code: 'IS206',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A501', professorName: 'د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Computer Program Design',
                        code: 'IS301',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'A501', professorName: 'د. مجدي أحمد عبد البر', type: 'Lecture' },
                            { day: 'السبت', startTime: '08:30', endTime: '10:00', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'السبت', startTime: '10:00', endTime: '11:30', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A507', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A404', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'A405', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A505', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الأربعاء', startTime: '10:00', endTime: '11:30', room: 'A405', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A505', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A405', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '10:00', endTime: '11:30', room: 'A409', professorName: 'م. محمد خالد أمين', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Insurance & Risk Management',
                        code: 'IS302',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'A104', professorName: 'أ.م.د حسن صلاح محمد الدسوقي', type: 'Lecture' },
                            { day: 'السبت', startTime: '08:30', endTime: '10:00', room: 'A503', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'السبت', startTime: '10:00', endTime: '11:30', room: 'A402', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'السبت', startTime: '10:00', endTime: '11:30', room: 'A403', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A402', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'B108', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'B103', professorName: 'م. جالا محمد علي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Macroeconomics',
                        code: 'IS303',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A301', professorName: 'د. عزت عبد الله عبد الحليم', type: 'Lecture' },
                            { day: 'السبت', startTime: '08:30', endTime: '10:00', room: 'B202', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'السبت', startTime: '10:00', endTime: '11:30', room: 'B103', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'B103', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'B103', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'B107', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'B107', professorName: 'م. امير سلطان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Investment',
                        code: 'IS304',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'د. رزق غبريال بسيط عجبان', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'B108', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'B103', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'B108', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'B202', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'B103', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Databases',
                        code: 'IS305',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'د. محمد أحمد محفوظ', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A409', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A405', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A404', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الخميس', startTime: '10:00', endTime: '11:30', room: 'A405', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '13:00', endTime: '14:30', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الخميس', startTime: '13:00', endTime: '14:30', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Business Analytics & Data Mining',
                        code: 'IS401',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'A201', professorName: 'أ.د. مجدي أحمد عبد البر', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A404', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A405', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A409', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A404', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A505', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A410', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A409', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A404', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A506', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A410', professorName: 'م. طارق عصام', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Strategic Management',
                        code: 'IS402',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A502', professorName: 'د. رزق غبريال بسيط عجبان', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Computer Program Applications',
                        code: 'IS403',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'أ.د. مجدي أحمد عبد البر', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A410', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A410', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A404', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A303', professorName: 'م. محمد خالد أمين', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A207', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A410', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A409', professorName: 'م. سهيله ياسر', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A303', professorName: 'م. محمد خالد أمين', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Applied Statistics',
                        code: 'IS404',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A201', professorName: 'أ.د عادل نسيم', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A501', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:30', room: 'A502', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'B202', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Graduation Project',
                        code: 'IS405',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A501', professorName: 'د. محمد أحمد محفوظ', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '12:30', endTime: '15:30', room: 'A301', professorName: 'د. احمد امين', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Enterprise Information Systems',
                        code: 'IS406',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'د. محمد أحمد محفوظ', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        name: 'Computer Science',
        code: 'CS',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'English Language',
                        code: 'CS101',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '10:30', room: 'A406', professorName: 'د. مبروك إسماعيل', type: 'Lecture' },
                            { day: 'الخميس', startTime: '10:30', endTime: '12:00', room: 'A304', professorName: 'م. هبة أشرف أحمد', type: 'Section' },
                            { day: 'الخميس', startTime: '12:00', endTime: '13:30', room: 'A406', professorName: 'م. هبة أشرف أحمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Introduction to Computer Science',
                        code: 'CS102',
                        schedules: [
                            { day: 'السبت', startTime: '10:30', endTime: '12:30', room: 'A406', professorName: 'د. مجدي أحمد عبد البر', type: 'Lecture' },
                            { day: 'السبت', startTime: '12:30', endTime: '14:00', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'السبت', startTime: '14:00', endTime: '15:30', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الاثنين', startTime: '12:30', endTime: '14:00', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:00', endTime: '15:30', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Introduction to Information Systems',
                        code: 'CS103',
                        schedules: [
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:30', room: 'A301', professorName: 'د. احمد امين', type: 'Lecture' },
                            { day: 'السبت', startTime: '12:30', endTime: '14:00', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'السبت', startTime: '14:00', endTime: '15:30', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الاثنين', startTime: '12:30', endTime: '14:00', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:00', endTime: '15:30', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Physics',
                        code: 'CS104',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:30', room: 'A301', professorName: 'د. جمال الدين عبد الحكيم محمد', type: 'Lecture' },
                            { day: 'السبت', startTime: '12:30', endTime: '14:00', room: 'A408', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'السبت', startTime: '14:00', endTime: '15:30', room: 'A408', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Calculus and Integration',
                        code: 'CS105',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:30', room: 'A201', professorName: 'أ.م.د حسن صلاح محمد الدسوقي', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '10:30', endTime: '12:00', room: 'A503', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الخميس', startTime: '10:30', endTime: '12:00', room: 'A206', professorName: 'م. طارق عصام', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Mathematics',
                        code: 'CS106',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '10:30', room: 'A402', professorName: 'د. جمال الدين عبد الحكيم محمد', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Business Administration',
                        code: 'CS201',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'A206', professorName: 'د. محمد أحمد المرزوقي', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'File Processing',
                        code: 'CS202',
                        schedules: [
                            { day: 'الخميس', startTime: '10:30', endTime: '12:30', room: 'A503', professorName: 'د. محمد أحمد محفوظ', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأربعاء', startTime: '10:00', endTime: '11:30', room: 'A506', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A506', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A506', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Object Oriented Programming (OOP)',
                        code: 'CS203',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '10:30', room: 'A408', professorName: 'أ.م.د ايمان منير علي', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الأربعاء', startTime: '10:30', endTime: '12:00', room: 'A404', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الخميس', startTime: '12:30', endTime: '14:00', room: 'A507', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الخميس', startTime: '14:00', endTime: '15:30', room: 'A507', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Ethics',
                        code: 'CS204',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'A201', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Systems Analysis and Design',
                        code: 'CS205',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:30', room: 'A501', professorName: 'د. شريف محمد صبحي', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '13:30', endTime: '15:00', room: 'A409', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الأربعاء', startTime: '12:00', endTime: '13:30', room: 'A507', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A405', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الخميس', startTime: '12:00', endTime: '13:30', room: 'A404', professorName: 'م. طارق عصام', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Computer Architecture',
                        code: 'CS301',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '10:30', room: 'A408', professorName: 'أ.د ابراهيم سليم', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:00', room: 'A303', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:00', room: 'A405', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A505', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الاثنين', startTime: '15:00', endTime: '16:30', room: 'A409', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Information Retrieval Systems',
                        code: 'CS302',
                        schedules: [
                            { day: 'الاثنين', startTime: '12:30', endTime: '14:30', room: 'A408', professorName: 'د. شريف محمد صبحي', type: 'Lecture' },
                            { day: 'السبت', startTime: '10:30', endTime: '12:00', room: 'A507', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'السبت', startTime: '10:30', endTime: '12:00', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأحد', startTime: '13:30', endTime: '15:00', room: 'A505', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأحد', startTime: '13:30', endTime: '15:00', room: 'A506', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Software Engineering',
                        code: 'CS303',
                        schedules: [
                            { day: 'السبت', startTime: '12:00', endTime: '14:00', room: 'A503', professorName: 'د. اسلام سميح محمد عاطف', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:00', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A410', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A410', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الخميس', startTime: '14:00', endTime: '15:30', room: 'A505', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Web Programming',
                        code: 'CS304',
                        schedules: [
                            { day: 'السبت', startTime: '14:00', endTime: '16:00', room: 'A503', professorName: 'د. اسلام سميح محمد عاطف', type: 'Lecture' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A505', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الخميس', startTime: '12:30', endTime: '14:00', room: 'A506', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الخميس', startTime: '12:30', endTime: '14:00', room: 'A505', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الخميس', startTime: '14:00', endTime: '15:30', room: 'A405', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Logic Programming',
                        code: 'CS305',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:30', room: 'A408', professorName: 'د. شريف محمد صبحي', type: 'Lecture' },
                            { day: 'الأحد', startTime: '09:00', endTime: '10:30', room: 'A404', professorName: 'م. طارق عصام', type: 'Section' },
                            { day: 'الأحد', startTime: '09:00', endTime: '10:30', room: 'A405', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A409', professorName: 'م. هدير محمد الدسوقي', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A506', professorName: 'م. طارق عصام', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Analysis of Algorithms',
                        code: 'CS306',
                        schedules: [
                            { day: 'الخميس', startTime: '10:30', endTime: '12:30', room: 'A408', professorName: 'أ.م.د ايمان منير علي', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:00', endTime: '12:30', room: 'A303', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A507', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:00', room: 'A505', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الخميس', startTime: '12:30', endTime: '14:00', room: 'A405', professorName: 'م. حسين البطران', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Operating Systems Theories',
                        code: 'CS401',
                        schedules: [
                            { day: 'الخميس', startTime: '12:30', endTime: '14:30', room: 'A301', professorName: 'أ.م.د ايمان منير علي', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'A505', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:30', endTime: '15:00', room: 'A410', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A505', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A507', professorName: 'م. حسين البطران', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Dynamic Languages',
                        code: 'CS402',
                        schedules: [
                            { day: 'الاثنين', startTime: '10:30', endTime: '12:30', room: 'A408', professorName: 'د. مصطفى مشرفة', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A409', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A506', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A505', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الخميس', startTime: '10:00', endTime: '11:30', room: 'A506', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Computer Language Concepts',
                        code: 'CS403',
                        schedules: [
                            { day: 'الأربعاء', startTime: '10:30', endTime: '12:30', room: 'A408', professorName: 'د. مصطفى مشرفة', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '10:00', room: 'A405', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A409', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A409', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                            { day: 'الخميس', startTime: '10:00', endTime: '11:30', room: 'A410', professorName: 'م. ساره ايمن موريس', type: 'Section' },
                        ]
                    },
                    {
                        name: 'E-Business',
                        code: 'CS404',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '10:30', room: 'A304', professorName: 'د. اسلام سميح محمد عاطف', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A507', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A505', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A506', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A506', professorName: 'م. فاطمه اسماعيل سالم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Artificial Intelligence',
                        code: 'CS405',
                        schedules: [
                            { day: 'السبت', startTime: '10:30', endTime: '12:30', room: 'A408', professorName: 'د. مصطفى مشرفة', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A506', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A410', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A410', professorName: 'م. حسين البطران', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A505', professorName: 'م. طاهر أبوزيد السنوسي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Graduation Project 1',
                        code: 'CS406',
                        schedules: [
                            { day: 'السبت', startTime: '12:30', endTime: '14:30', room: 'A305', professorName: 'أ.د ابراهيم سليم', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:30', room: 'A305', professorName: 'أ.د ابراهيم سليم', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '12:30', endTime: '14:30', room: 'A406', professorName: 'د. جمال حمدان', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A406', professorName: 'د. جمال حمدان', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '12:30', endTime: '14:30', room: 'A406', professorName: 'د. جمال حمدان', type: 'Lecture' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:30', room: 'A305', professorName: 'أ.م.د ايمان منير علي', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        name: 'Accounting',
        code: 'ACC',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'Principles of Business Administration',
                        code: 'ACC101',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'S101', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Financial Accounting',
                        code: 'ACC102',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'S101', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A406', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A402', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A403', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A406', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A503', professorName: 'م. أماني إمام محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A406', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'A502', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الاثنين', startTime: '13:00', endTime: '14:30', room: 'A502', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Foreign Language (1)',
                        code: 'ACC103',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. مبروك إسماعيل', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'S101', professorName: 'د. مبروك إسماعيل', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A502', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'A503', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A502', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الأحد', startTime: '13:00', endTime: '14:30', room: 'A503', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A201', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A201', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'A501', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الاثنين', startTime: '13:00', endTime: '14:30', room: 'A501', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Law',
                        code: 'ACC104',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'S101', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Psychology',
                        code: 'ACC105',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'د. عمرو محمد ابراهيم محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Human Rights',
                        code: 'ACC106',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A201', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Mathematics',
                        code: 'ACC107',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A104', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                            { day: 'الخميس', startTime: '13:00', endTime: '14:30', room: 'A104', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Principles of Marketing',
                        code: 'ACC201',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A104', professorName: 'د. ماجدة محمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Cost Accounting',
                        code: 'ACC202',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. مصطفى نصر الدين أحمد', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A304', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A403', professorName: 'م. أماني إمام محمد', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A206', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م. نورها احمد محمد محمد', type: 'Section' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A403', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                            { day: 'الخميس', startTime: '13:00', endTime: '14:30', room: 'A206', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Microeconomics',
                        code: 'ACC203',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. محمود عزت عباس عبد الحافظ', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A402', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A503', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A501', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأربعاء', startTime: '10:00', endTime: '11:30', room: 'A206', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A402', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A403', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Production & Operations Management',
                        code: 'ACC204',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. احمد محمد حسن عبد الجواد', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A402', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'B202', professorName: 'م. امير سلطان', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A304', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A307', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الخميس', startTime: '13:00', endTime: '14:30', room: 'B202', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Analytics',
                        code: 'ACC205',
                        schedules: [
                            { day: 'الأربعاء', startTime: '12:30', endTime: '15:30', room: 'A301', professorName: 'د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Logistics & Supply Chain Management',
                        code: 'ACC206',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Principles of Macroeconomics',
                        code: 'ACC301',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'أ.د نجلاء محمد إبراهيم بكر', type: 'Lecture' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A304', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A503', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A402', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A503', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A302', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Investment',
                        code: 'ACC302',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A502', professorName: 'د. رزق غبريال بسيط عجبان', type: 'Lecture' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'B206', professorName: 'م.م هشام صلاح فوزى', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A408', professorName: 'م.م هشام صلاح فوزى', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'B108', professorName: 'م.م هشام صلاح فوزى', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م.م هشام صلاح فوزى', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Insurance & Risk Management',
                        code: 'ACC303',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A503', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A301', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A408', professorName: 'م. جالا محمد علي', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'A304', professorName: 'م. إبراهيم خليل', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Intermediate Accounting (1)',
                        code: 'ACC304',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A104', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A402', professorName: 'م. أماني إمام محمد محمد', type: 'Section' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'B108', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A206', professorName: 'م. جالا محمد علي', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'A403', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'A201', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Ethics and Governance',
                        code: 'ACC305',
                        schedules: [
                            { day: 'الأربعاء', startTime: '10:00', endTime: '13:00', room: 'A304', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Auditing',
                        code: 'ACC401',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A501', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'B108', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'A402', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                            { day: 'السبت', startTime: '13:30', endTime: '15:00', room: 'A304', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A201', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A206', professorName: 'م. جالا محمد علي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Applied Statistics',
                        code: 'ACC402',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'أ.م.د حسن صلاح محمد الدسوقي', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'A406', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'A403', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'B108', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'A406', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A501', professorName: 'م. إبراهيم خليل', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Corporate Analysis and Valuation',
                        code: 'ACC403',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'A502', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'السبت', startTime: '12:00', endTime: '13:00', room: 'A304', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'A406', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A201', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A302', professorName: 'م. محمد احمد عفيفي محمد', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A408', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Advanced Financial Accounting',
                        code: 'ACC404',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A202', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A304', professorName: 'م. محمد احمد عفيفي محمد', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م. جالا محمد علي', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A202', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Strategic Management',
                        code: 'ACC405',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'A202', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Graduation Project',
                        code: 'ACC406',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'A502', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        name: 'Accounting English',
        code: 'ACC-EN',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'Principles of Law',
                        code: 'ACC-EN101',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'B107', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Foreign Language (1)',
                        code: 'ACC-EN102',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'B107', professorName: 'د. مبروك إسماعيل', type: 'Lecture' },
                            { day: 'الأحد', startTime: '11:30', endTime: '13:00', room: 'B108', professorName: 'م. بلال محمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Psychology',
                        code: 'ACC-EN103',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'B206', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Business Administration',
                        code: 'ACC-EN104',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'B202', professorName: 'د. محمد صلاح الدين محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Mathematics',
                        code: 'ACC-EN105',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'B108', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Financial Accounting',
                        code: 'ACC-EN106',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '10:00', endTime: '11:30', room: 'B108', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Business Analytics',
                        code: 'ACC-EN201',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. محمد صلاح الدين محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Production & Operations Management',
                        code: 'ACC-EN202',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'B108', professorName: 'د. احمد محمد سلام', type: 'Lecture' },
                            { day: 'الخميس', startTime: '10:00', endTime: '11:30', room: 'B107', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Cost Accounting',
                        code: 'ACC-EN203',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Logistics & Supply Chain Management',
                        code: 'ACC-EN204',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'A402', professorName: 'د. عمرو محمد ابراهيم محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Microeconomics',
                        code: 'ACC-EN205',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. محمود عزت عباس عبد الحافظ', type: 'Lecture' },
                            { day: 'الخميس', startTime: '08:30', endTime: '10:00', room: 'B107', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Marketing',
                        code: 'ACC-EN206',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'B108', professorName: 'د. احمد محمد سلام', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Insurance & Risk Management',
                        code: 'ACC-EN301',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'B206', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Macroeconomics',
                        code: 'ACC-EN302',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'B103', professorName: 'أ.د نجلاء محمد إبراهيم بكر', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '13:00', endTime: '14:30', room: 'B108', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Intermediate Accounting (1)',
                        code: 'ACC-EN303',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'B206', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م.م نهى محمد شحات سليمان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Ethics and Governance',
                        code: 'ACC-EN304',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'B206', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Investment',
                        code: 'ACC-EN305',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. محمد صلاح الدين محمد', type: 'Lecture' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'B108', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Strategic Management',
                        code: 'ACC-EN401',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'B107', professorName: 'د. احمد محمد سلام', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Advanced Financial Accounting',
                        code: 'ACC-EN402',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'B107', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'B107', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Applied Statistics',
                        code: 'ACC-EN403',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'B107', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'B107', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Corporate Analysis and Valuation',
                        code: 'ACC-EN404',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'B108', professorName: 'د. احمد صلاح سيد محمد', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'B107', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Auditing',
                        code: 'ACC-EN405',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'B107', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م.م آية عصام محمد عبد الرحيم', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Graduation Project',
                        code: 'ACC-EN406',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'B206', professorName: 'د. يحيى على احمد المرسى', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        name: 'Banking Management',
        code: 'BM',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'Principles of Law',
                        code: 'BM101',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A104', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Financial Accounting',
                        code: 'BM102',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'A104', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A501', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A503', professorName: 'م. وحيد عادل يحيي', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A201', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A403', professorName: 'م.م علي احمد عبد العزيز', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Foreign Language (1)',
                        code: 'BM103',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A104', professorName: 'د. شيماء أحمد فرغل', type: 'Lecture' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A201', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الأحد', startTime: '08:30', endTime: '10:00', room: 'A502', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A406', professorName: 'م. بلال محمد', type: 'Section' },
                            { day: 'الأحد', startTime: '10:00', endTime: '11:30', room: 'A502', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Human Rights',
                        code: 'BM104',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Psychology',
                        code: 'BM105',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A301', professorName: 'د. عمرو محمد ابراهيم محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Business Administration',
                        code: 'BM106',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'A104', professorName: 'د. ماجدة محمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Mathematics',
                        code: 'BM107',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A302', professorName: 'د. جمال الدين عبد الحكيم محمد', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Logistics & Supply Chain Management',
                        code: 'BM201',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'أ.د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Cost Accounting',
                        code: 'BM202',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'د. مصطفى نصر الدين أحمد أبو العزم', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'A402', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A402', professorName: 'م.م بسام جمال فاروق', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م. أماني إمام محمد محمد', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A402', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Microeconomics',
                        code: 'BM203',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A501', professorName: 'د. محمود عزت عباس عبد الحافظ', type: 'Lecture' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'B202', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'السبت', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A304', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A403', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Analytics',
                        code: 'BM204',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Production & Operations Management',
                        code: 'BM205',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'A501', professorName: 'د. احمد محمد حسن عبد الجواد', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '14:30', endTime: '16:00', room: 'A403', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'B202', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                            { day: 'الأربعاء', startTime: '11:30', endTime: '13:00', room: 'A402', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                            { day: 'الأربعاء', startTime: '13:00', endTime: '14:30', room: 'B202', professorName: 'م.م انجى فرج فهمى', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Marketing',
                        code: 'BM206',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'د. ماجدة محمد فرغل', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Economics of Banks',
                        code: 'BM301',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A502', professorName: 'د. محمود عزت عباس عبد الحافظ', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Insurance & Risk Management',
                        code: 'BM302',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'A201', professorName: 'د. جمال الدين عبد الحكيم محمد', type: 'Lecture' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'A307', professorName: 'م. إبراهيم خليل', type: 'Section' },
                            { day: 'السبت', startTime: '11:30', endTime: '13:00', room: 'A403', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A402', professorName: 'م. أحمد ناصر احمد شيبه الحمد', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A206', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Macroeconomics',
                        code: 'BM303',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A104', professorName: 'أ.د نجلاء محمد إبراهيم بكر', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A202', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '13:00', room: 'A201', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'A501', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '13:00', endTime: '14:30', room: 'A503', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Bank Management & Control Systems',
                        code: 'BM304',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A201', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Investment',
                        code: 'BM305',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'د. رزق غبريال بسيط عجبان', type: 'Lecture' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A201', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'الأربعاء', startTime: '09:00', endTime: '10:30', room: 'A406', professorName: 'م. جهاد يحيى زكريا طه', type: 'Section' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Money Markets',
                        code: 'BM401',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A406', professorName: 'د. احمد محمد سلام', type: 'Lecture' },
                            { day: 'السبت', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                            { day: 'السبت', startTime: '10:00', endTime: '11:30', room: 'B202', professorName: 'م.م فتحى على فتحى شبل', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Applied Statistics',
                        code: 'BM402',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A201', professorName: 'أ.د عادل نسيم', type: 'Lecture' },
                            { day: 'السبت', startTime: '08:30', endTime: '10:00', room: 'A402', professorName: 'م. حسام محمد سيد', type: 'Section' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:30', room: 'B206', professorName: 'م. إبراهيم خليل', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Graduation Project',
                        code: 'BM403',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A206', professorName: 'د. محمد أحمد المرزوقى', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Management of Specialized Banking Institutions',
                        code: 'BM404',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A202', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Project Finance',
                        code: 'BM405',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'A502', professorName: 'د. محمد صلاح الدين محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Strategic Management',
                        code: 'BM406',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '14:30', room: 'A202', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        name: 'Business Administration',
        code: 'BA',
        levels: [
            {
                level: 1,
                courses: [
                    {
                        name: 'Principles of Business Administration',
                        code: 'BA101',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'S101', professorName: 'د. رضا دسوقي علام', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Financial Accounting',
                        code: 'BA102',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'S101', professorName: 'د. ابراهيم حسين محمود', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '10:00', endTime: '11:30', room: 'A406', professorName: 'م. رحاب ابوالعلا عبدالونيس', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Foreign Language (1)',
                        code: 'BA103',
                        schedules: [
                            { day: 'الأربعاء', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. مبروك إسماعيل', type: 'Lecture' },
                            { day: 'الاثنين', startTime: '08:30', endTime: '10:00', room: 'A201', professorName: 'م. شيماء روبي منصور', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Law',
                        code: 'BA104',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Psychology',
                        code: 'BA105',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'د. عمرو محمد ابراهيم محمد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Human Rights',
                        code: 'BA106',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A201', professorName: 'د. زينب محمد إبراهيم بكر', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Mathematics',
                        code: 'BA107',
                        schedules: [
                            { day: 'الخميس', startTime: '11:30', endTime: '13:00', room: 'A104', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 2,
                courses: [
                    {
                        name: 'Principles of Marketing',
                        code: 'BA201',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A104', professorName: 'د. ماجدة محمد فرغل', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Principles of Cost Accounting',
                        code: 'BA202',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A302', professorName: 'د. مصطفى نصر الدين أحمد أبو العزم', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: 'A403', professorName: 'م. نورهان احمد محمد محمد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Production & Operations Management',
                        code: 'BA203',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '08:30', endTime: '11:30', room: 'S201', professorName: 'د. احمد محمد حسن عبد الجواد', type: 'Lecture' },
                            { day: 'الثلاثاء', startTime: '14:30', endTime: '16:00', room: 'A406', professorName: 'م. امير سلطان', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Microeconomics',
                        code: 'BA204',
                        schedules: [
                            { day: 'الثلاثاء', startTime: '11:30', endTime: '14:30', room: 'S201', professorName: 'د. محمود عزت عباس عبد الحافظ', type: 'Lecture' },
                            { day: 'الخميس', startTime: '14:30', endTime: '16:00', room: 'A403', professorName: 'م. ندى محسن فايق محمد عبد الرازق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Business Analytics',
                        code: 'BA205',
                        schedules: [
                            { day: 'الأربعاء', startTime: '11:30', endTime: '14:30', room: 'A301', professorName: 'د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Logistics & Supply Chain Management',
                        code: 'BA206',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A302', professorName: 'أ.د. وليد محمد ميلاد', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 3,
                courses: [
                    {
                        name: 'Principles of Investment',
                        code: 'BA301',
                        schedules: [
                            { day: 'السبت', startTime: '11:30', endTime: '14:30', room: 'A502', professorName: 'د. رزق غبريال بسيط عجبان', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '14:30', endTime: '16:00', room: 'B202', professorName: 'م.م هشام صلاح فوزى', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Insurance & Risk Management',
                        code: 'BA302',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A202', professorName: 'د. حنان حسين حسن فرج', type: 'Lecture' },
                            { day: 'الأحد', startTime: '14:30', endTime: '16:00', room: 'A301', professorName: 'م. حسام محمد سيد', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Principles of Macroeconomics',
                        code: 'BA303',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A206', professorName: 'أ.د نجلاء محمد إبراهيم بكر', type: 'Lecture' },
                            { day: 'الأربعاء', startTime: '08:30', endTime: '10:00', room: '503', professorName: 'م.م إيمان رمضان أحمد عبد الله', type: 'Section' },
                        ]
                    },
                    {
                        name: 'International Marketing',
                        code: 'BA304',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'A206', professorName: 'د. محمد أحمد المرزوقى', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Business Ethics and Governance',
                        code: 'BA305',
                        schedules: [
                            { day: 'الأربعاء', startTime: '10:00', endTime: '13:00', room: 'A304', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                ]
            },
            {
                level: 4,
                courses: [
                    {
                        name: 'Graduation Project',
                        code: 'BA401',
                        schedules: [
                            { day: 'السبت', startTime: '08:30', endTime: '11:30', room: 'A206', professorName: 'د. محمد أحمد المرزوقى', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Applied Statistics',
                        code: 'BA402',
                        schedules: [
                            { day: 'الخميس', startTime: '08:30', endTime: '11:30', room: 'A301', professorName: 'أ.م.د حسن صلاح محمد الدسوقى', type: 'Lecture' },
                            { day: 'السبت', startTime: '13:00', endTime: '14:30', room: 'A403', professorName: 'م. مروة حنفي مرزوق', type: 'Section' },
                        ]
                    },
                    {
                        name: 'Financial Portfolio & Derivatives Management',
                        code: 'BA403',
                        schedules: [
                            { day: 'الأحد', startTime: '08:30', endTime: '11:30', room: 'A304', professorName: 'د. عزت عبد الله عبد الحليم', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Enterprise Information Systems',
                        code: 'BA404',
                        schedules: [
                            { day: 'الأحد', startTime: '11:30', endTime: '14:30', room: 'A304', professorName: 'د. محمد أحمد محفوظ', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Leadership',
                        code: 'BA405',
                        schedules: [
                            { day: 'الاثنين', startTime: '08:30', endTime: '11:30', room: 'A206', professorName: 'د. محمد أحمد المرزوقى', type: 'Lecture' },
                        ]
                    },
                    {
                        name: 'Strategic Management',
                        code: 'BA406',
                        schedules: [
                            { day: 'الاثنين', startTime: '11:30', endTime: '14:30', room: 'A202', professorName: 'د. عاطف فتحى حبيب سيدهم', type: 'Lecture' },
                        ]
                    },
                ]
            },
        ]
    },
];

async function main() {
    console.log('Start seeding courses...');

    for (const major of majorsData) {
        console.log(`Processing Major: ${major.name}`);
        for (const level of major.levels) {
            console.log(`  Processing Level ${level.level}`);
            for (const courseData of level.courses) {
                // 1. Upsert Course
                const courseCode = `${major.code}${level.level}0${level.courses.indexOf(courseData) + 1}`; // Simple code generation: IS101, IS102...

                // We need a professor for the course. We'll use the professor from the first lecture found.
                // If no lecture, use the first section's instructor.
                const mainSchedule = courseData.schedules.find(s => s.type === 'Lecture') || courseData.schedules[0];
                const professor = await upsertProfessor(mainSchedule.professorName);

                const course = await prisma.course.upsert({
                    where: {
                        courseCode_semester_academicYear: {
                            courseCode,
                            semester: 'SPRING',
                            academicYear: '2024/2025'
                        }
                    },
                    update: {
                        courseName: courseData.name,
                        professorId: professor.id,
                        major: major.code,
                        level: level.level,
                    },
                    create: {
                        courseName: courseData.name,
                        courseCode: courseCode,
                        professorId: professor.id,
                        description: `Course for ${major.name} Level ${level.level}`,
                        major: major.code,
                        level: level.level,
                        semester: 'SPRING',
                        academicYear: '2024/2025'
                    },
                });

                // 2. Create Schedules
                // First, delete existing schedules for this course to avoid duplicates if re-running
                await prisma.schedule.deleteMany({
                    where: { courseId: course.id },
                });

                for (const scheduleData of courseData.schedules) {
                    const scheduleProfessor = await upsertProfessor(scheduleData.professorName);

                    await prisma.schedule.create({
                        data: {
                            courseId: course.id,
                            professorId: scheduleProfessor.id,
                            dayOfWeek: dayMap[scheduleData.day],
                            startTime: scheduleData.startTime,
                            endTime: scheduleData.endTime,
                            room: scheduleData.room,
                            semester: 'Spring 2025',
                        }
                    });
                }
            }
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

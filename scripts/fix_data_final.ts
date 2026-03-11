import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const courseTranslation: Record<string, string> = {
    "مبادئ الإدارة المالية": "Principles of Financial Management",
    "مبادئ المحاسبة المالية": "Principles of Financial Accounting",
    "لغة أجنبية (2)": "Foreign Language (2)",
    "الغة أجنبية (2)": "Foreign Language (2)",
    "مبادئ المحاسبة الإدارية": "Principles of Managerial Accounting",
    "إدارة الموارد البشرية": "Human Resources Management",
    "مبادئ المالية العامة": "Principles of Public Finance",
    "الإساليب الكمية وإتخاذ القرارات": "Quantitative Methods & Decision Making",
    "الأساليب الكمية وإتخاذ القرارات": "Quantitative Methods & Decision Making",
    "رياضيات الاعمال": "Business Mathematics",
    "مبادئ الإقتصاد": "Principles of Economics",
    "الإتصالات التسويقية المتكاملة": "Integrated Marketing Communications",
    "إدارة الجودة الشاملة": "Total Quality Management",
    "اقتصاديات النقود والبنوك": "Economics of Money and Banking",
    "إدارة التفاوض": "Negotiation Management",
    "ريادة الأعمال والمشروعات الصغيرة": "Entrepreneurship & Small Business",
    "القانون التجاري": "Commercial Law",
    "رياضة التمويل والإستثمار": "Mathematics of Finance & Investment",
    "نظم المعلومات الإدارية": "Management Information Systems",
    "الإدارة الإستراتيجية للموارد البشرية": "Strategic Human Resource Management",
    "نظم المعلومات المحاسبية": "Accounting Information Systems",
    "إدارة الأعمال الالكترونية": "E-Business Management",
    "بحث تخرج فى مجال التخصص..": "Graduation Research Project",
    "بحث تخرج فى مجال التخصص.": "Graduation Research Project",
    "بحث تخرج في مجال التخصص..": "Graduation Research Project",
    "إدارة التغيير": "Change Management",
    "السلوك التنظيمي": "Organizational Behavior",
    "طرق و مهارات الاتصال": "Communication Skills",
    "التفكير الابتكارى": "Innovative Thinking",
    "التفكير الابتكاري": "Innovative Thinking",
    "مبادئ المحاسبة المالية 2": "Principles of Financial Accounting 2",
    "علم الاجتماع": "Sociology",
    "مبادئ العلوم السياسية": "Principles of Political Science",
    "المحاسبة في الوحدات الحكومية غير": "Accounting in Non-Profit Govt Units",
    "المحاسبة فى الوحدات الحكومية غير": "Accounting in Non-Profit Govt Units",
    "المحاسبة فى الوحدات الحكومية غير الهادفة للربح": "Accounting in Non-Profit Govt Units",
    "المحاسبة في الوحدات الحكومية غير الهادفة للربح": "Accounting in Non-Profit Govt Units",
    "إدارة المخاطر": "Risk Management",
    "السياسات النقدية والإئتمانية": "Monetary & Credit Policies",
    "قانون نقد و مصارف": "Money & Banking Law",
    "إدارة البنوك الإسلامية": "Islamic Banking Management",
    "تسويق الخدمات المصرفية": "Banking Services Marketing",
    "المحاسبة المتوسطة (2)": "Intermediate Accounting (2)",
    "مراجعة النظم الالكترونية": "Audit of Electronic Systems",
    "المحاسبة الضريبية": "Tax Accounting",
    "المحاسبة في المنشأت المتخصصة": "Accounting for Specialized Entities",
    "المحاسبة في المنشآت المتخصصة": "Accounting for Specialized Entities",
    "التنقيب عن البيانات": "Data Mining",
    "التجارة الالكترونية": "E-Commerce",
    "معالجة الصور الرقمية": "Digital Image Processing",
    "النظم الخبيرة": "Expert Systems",
    "شبكات الحاسب": "Computer Networks",
    "هياكل البيانات": "Data Structures",
    "أساسيات الوسائط المتعددة": "Multimedia Fundamentals",
    "بحوث العمليات": "Operations Research",
    "لغة التجمع": "Assembly Language",
    "لغة التجميع": "Assembly Language",
    "أمن المعلومات": "Information Security",
    "نظرية وتصميم المترجمات": "Compiler Theory & Design",
    "تطوير تطبيقات الجوال": "Mobile App Development",
    "اتصالات البيانات": "Data Communications",
    "الرسم بالحاسب": "Computer Graphics",
    "مشروع التخرج 2": "Graduation Project 2",
    "برمجة الحاسبات": "Computer Programming",
    "إحصاء واحتمالات": "Statistics & Probability",
    "رياضيات": "Mathematics",
    "الرياضيات غير المتصلة": "Discrete Mathematics",
    "مقدمة في قواعد البيانات": "Introduction to Databases",
    "الجبر الخطي": "Linear Algebra",
    "مقدمة في علم البيئة": "Introduction to Environmental Science",
    "طرق اتصال الإنسان بالحاسب": "Human-Computer Interaction",
    "ضبط وتوكيد الجودة": "Quality Control & Assurance",
    "حقوق الإنسان": "Human Rights",
    "استراتيجية نظم المعلومات": "Information Systems Strategy",
    "إدارة المخاطر وأمن المعلومات": "Risk Management & Info Security",
    "تكنولوجيا المعلومات والابتكار": "IT and Innovation",
    "البنية التحتية لتكنولوجيا المعلومات": "IT Infrastructure",
    "تحليل وتصميم نظم المعلومات": "IS Analysis & Design"
};

function normalizeProfName(name: string): { firstName: string, lastName: string, fullName: string } {
    const cleanName = name.replace(/^(أ\.م\.د|أ\.د|د|م\.م|م|ا)\.?\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Unknown';
    return { firstName, lastName, fullName: cleanName };
}

async function main() {
    console.log("Starting data fix script...");

    // 1. Load extracted data
    const rawData = JSON.parse(fs.readFileSync('full_extracted_schedules.json', 'utf8'));
    console.log(`Loaded ${rawData.length} schedule entries.`);

    // 2. Warm up connection
    try {
        const count = await retry(() => prisma.user.count());
        console.log(`Connection warmed up. User count: ${count}`);
    } catch (e) {
        console.error("Warmup failed, but trying to proceed:", e);
    }

    // 3. Fix Course Names in DB
    console.log("Translating course names...");
    const courses = await retry(() => prisma.course.findMany());
    for (const course of courses) {
        const englishName = courseTranslation[course.courseName];
        if (englishName) {
            await prisma.course.update({
                where: { id: course.id },
                data: { courseName: englishName }
            });
            console.log(`Translated: ${course.courseName} -> ${englishName}`);
        } else if (/[\u0600-\u06FF]/.test(course.courseName)) {
            console.warn(`Untranslated Arabic course name: ${course.courseName}`);
        }
    }

    // 3. Correct Professor Assignments
    console.log("Correcting professor assignments...");
    for (const entry of rawData) {
        const { fullName, firstName, lastName } = normalizeProfName(entry.professor);
        const englishCourseName = courseTranslation[entry.courseName] || entry.courseName;

        // Find or create professor with retry
        let professor = await retry(() => prisma.user.findFirst({
            where: {
                role: 'PROFESSOR',
                OR: [
                    { firstName, lastName },
                    { name: fullName }
                ]
            }
        }));

        if (!professor) {
            const uid = Math.floor(10000000 + Math.random() * 90000000).toString();
            professor = await retry(() => prisma.user.create({
                data: {
                    universityId: uid,
                    email: `prof.${uid}@smartcampus.edu`,
                    password: 'temporary_password_123',
                    firstName,
                    lastName,
                    name: fullName,
                    role: 'PROFESSOR'
                }
            }));
            console.log(`Created Professor: ${fullName}`);
        }

        // Find and update course
        const coursesToUpdate = await retry(() => prisma.course.findMany({
            where: {
                OR: [
                    { courseName: englishCourseName },
                    { courseName: entry.courseName }
                ],
                major: entry.majorFolder || entry.majorCode
            }
        }));

        for (const course of coursesToUpdate) {
            if (course.professorId !== professor.id) {
                await retry(() => prisma.course.update({
                    where: { id: course.id },
                    data: { professorId: professor.id }
                }));
                console.log(`Linked Course "${course.courseName}" to Professor "${fullName}"`);
            }
        }

        // Also update schedules if they exist
        await retry(() => prisma.schedule.updateMany({
            where: {
                course: {
                    OR: [
                        { courseName: englishCourseName },
                        { courseName: entry.courseName }
                    ]
                }
            },
            data: { professorId: professor.id }
        }));
    }
    console.log("Data fix completed successfully!");
}

async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0) {
            console.warn("Retrying due to error...", e);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return retry(fn, retries - 1);
        }
        throw e;
    }
}

main()
    .catch(e => console.error("Error during execution:", e))
    .finally(() => prisma.$disconnect());

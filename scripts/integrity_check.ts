import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const doctorPrefixes = ['د.', 'د/', 'أ.د', 'أ.م.د', 'م.د', 'Dr.', 'Prof.'];
const taPrefixes = ['م.', 'Eng.', 'مهندس', 'المعيد'];

function isDoctor(name: string): boolean {
    return doctorPrefixes.some(pref => name.includes(pref));
}

function isTA(name: string): boolean {
    return taPrefixes.some(pref => name.includes(pref));
}

async function main() {
    console.log('--- COMPREHENSIVE COURSE PROFESSOR AUDIT ---');

    const courses = await prisma.course.findMany({
        where: { isActive: true },
        include: {
            professor: {
                select: { id: true, name: true, role: true }
            },
            schedules: {
                where: { isActive: true },
                include: {
                    professor: {
                        select: { id: true, name: true, role: true }
                    }
                }
            }
        }
    });

    const reports = {
        taLeadWithDoctorInSchedule: [] as any[],
        noDoctorFoundAnywhere: [] as any[],
        multipleDoctorsFound: [] as any[]
    };

    for (const course of courses) {
        const leadName = course.professor?.name || 'UNKNOWN';
        const leadIsDoc = isDoctor(leadName);

        const scheduleProfs = course.schedules.map(s => s.professor).filter(Boolean);
        const doctorsInSchedule = scheduleProfs.filter(p => isDoctor(p!.name));

        // Case 1: TA is lead but Doctor is in schedule
        if (!leadIsDoc && doctorsInSchedule.length > 0) {
            reports.taLeadWithDoctorInSchedule.push({
                courseId: course.id,
                courseName: course.courseName,
                leadProf: leadName,
                doctorsFound: doctorsInSchedule.map(d => d!.name).join(', ')
            });
        }

        // Case 2: No Doctor anywhere (Might be intended, but good to check)
        if (!leadIsDoc && doctorsInSchedule.length === 0) {
            reports.noDoctorFoundAnywhere.push({
                courseId: course.id,
                courseName: course.courseName,
                leadProf: leadName,
                allInstructors: [...new Set(scheduleProfs.map(p => p!.name))].join(', ')
            });
        }

        // Case 3: Multiple Doctors (Check if it's co-teaching or data mess)
        const uniqueDoctors = new Set();
        if (leadIsDoc) uniqueDoctors.add(leadName);
        doctorsInSchedule.forEach(d => uniqueDoctors.add(d!.name));

        if (uniqueDoctors.size > 1) {
            reports.multipleDoctorsFound.push({
                courseId: course.id,
                courseName: course.courseName,
                doctors: Array.from(uniqueDoctors).join(', ')
            });
        }
    }

    console.log('\n1. TA LEADS WITH DOCTORS IN SCHEDULE (NEEDS FIX):');
    if (reports.taLeadWithDoctorInSchedule.length > 0) {
        console.table(reports.taLeadWithDoctorInSchedule);
    } else {
        console.log('None found. Great!');
    }

    console.log('\n2. COURSES WITH NO DOCTOR FOUND ANYWHERE (CHECK IF INTENDED):');
    // These are often Labs or Sections
    if (reports.noDoctorFoundAnywhere.length > 0) {
        console.log(`Found ${reports.noDoctorFoundAnywhere.length} courses. (Usually Labs/TAs only)`);
        // Just show a few as sample
        console.table(reports.noDoctorFoundAnywhere.slice(0, 5));
    }

    console.log('\n3. MULTIPLE DOCTORS FOUND (VERIFY CO-TEACHING):');
    if (reports.multipleDoctorsFound.length > 0) {
        console.table(reports.multipleDoctorsFound);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

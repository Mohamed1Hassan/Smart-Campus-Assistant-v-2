import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeName(name: string): string {
  if (!name) return '';
  
  // Lowercase
  let normalized = name.toLowerCase();

  // Remove common titles in Arabic and English
  const titles = [
    'dr.', 'dr', 'prof.', 'prof', 'eng.', 'eng', 'mme', 'mrs', 'mr.', 'mr',
    'د.', 'د', 'أ.د', 'أ.د.', 'م.', 'م', 'أستاذ', 'دكتور', 'دكتورة', 'مهندس', 'مهندسة'
  ];

  for (const title of titles) {
    // Match titles at the beginning or after a space
    const regex = new RegExp(`(^|\\s)${title}(\\s|\\.|$)`, 'g');
    normalized = normalized.replace(regex, ' ');
  }

  // Remove extra spaces and punctuation
  normalized = normalized.replace(/[.,:;]/g, '').replace(/\s+/g, ' ').trim();

  return normalized;
}

// Simple name similarity wrapper (could be improved)
function areNamesSimilar(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2 && n1 !== '') return true;
  
  // Optional: check if one is a subset of the other (e.g. "Mohamed Hassan" and "Mohamed Ahmed Hassan")
  // But let's stick to exact normalized first for safety
  return false;
}

async function auditProfessors() {
  console.log('--- 🛡️ Smart Campus Professor Audit ---');
  console.log('Fetching all professors and their associations...\n');

  const professors = await prisma.user.findMany({
    where: { role: UserRole.PROFESSOR },
    include: {
      _count: {
        select: {
          coursesCreated: true,
          schedules: true,
          examsCreated: true,
          qrCodesCreated: true,
        }
      }
    }
  });

  const emptyProfessors = [];
  const activeProfessors = [];
  const nameGroups: Record<string, any[]> = {};

  for (const prof of professors) {
    const totalActivity = 
      prof._count.coursesCreated + 
      prof._count.schedules + 
      prof._count.examsCreated + 
      prof._count.qrCodesCreated;

    const profData = {
      id: prof.id,
      universityId: prof.universityId,
      name: prof.name,
      email: prof.email,
      activity: {
        courses: prof._count.coursesCreated,
        schedules: prof._count.schedules,
        exams: prof._count.examsCreated,
        qrCodes: prof._count.qrCodesCreated
      }
    };

    if (totalActivity === 0) {
      emptyProfessors.push(profData);
    } else {
      activeProfessors.push(profData);
    }

    // Grouping for duplicate detection
    const normalized = normalizeName(prof.name);
    if (!nameGroups[normalized]) {
      nameGroups[normalized] = [];
    }
    nameGroups[normalized].push(profData);
  }

  // Identify Duplicates
  const potentialDuplicates = Object.values(nameGroups).filter(group => group.length > 1);

  console.log(`📊 Summary:`);
  console.log(`- Total Professors: ${professors.length}`);
  console.log(`- Active Professors (w/ activity): ${activeProfessors.length}`);
  console.log(`- Empty Professors (0 activity): ${emptyProfessors.length}`);
  console.log(`- Potential Duplicate Name Groups: ${potentialDuplicates.length}`);
  console.log('--------------------------------\n');

  if (emptyProfessors.length > 0) {
    console.log('❌ EMPTY PROFESSORS (Candidates for deletion if they are not in Spring Term):');
    console.table(emptyProfessors.map(p => ({
      ID: p.id,
      UniID: p.universityId,
      Name: p.name,
      Email: p.email
    })));
    console.log('\n');
  }

  if (potentialDuplicates.length > 0) {
    console.log('⚠️ POTENTIAL DUPLICATES (Same name, multiple accounts):');
    potentialDuplicates.forEach((group, index) => {
      console.log(`Group ${index + 1}: "${normalizeName(group[0].name)}"`);
      console.table(group.map(p => ({
        ID: p.id,
        UniID: p.universityId,
        Name: p.name,
        TotalCourses: p.activity.courses,
        TotalSchedules: p.activity.schedules
      })));
    });
  }

  if (emptyProfessors.length === 0 && potentialDuplicates.length === 0) {
    console.log('✅ No obvious issues found.');
  }
}

auditProfessors()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

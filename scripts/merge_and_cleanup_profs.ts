import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function normalizeName(name: string): Promise<string> {
  // Remove titles and extra spaces
  let cleanName = name
    .replace(/(أ\.م\.د|أ\.د|د\.|\.م\.م|م\.|د\/|أ\/)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split and take first and second part for binary naming
  const parts = cleanName.split(' ').filter(p => p.length > 1);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return cleanName;
}

async function mergeProfessors(survivorIdStr: string, redundantIdStr: string) {
  const survivorId = parseInt(survivorIdStr);
  const redundantId = parseInt(redundantIdStr);
  
  console.log(`Merging ID ${redundantId} into ID ${survivorId}...`);

  // Transfer Courses
  await prisma.course.updateMany({
    where: { professorId: redundantId },
    data: { professorId: survivorId },
  });

  // Transfer Schedules
  await prisma.schedule.updateMany({
    where: { professorId: redundantId },
    data: { professorId: survivorId },
  });

  // Transfer Exams
  await prisma.exam.updateMany({
    where: { professorId: redundantId },
    data: { professorId: survivorId },
  });

  // Transfer QRCodes
  await prisma.qRCode.updateMany({
    where: { professorId: redundantId },
    data: { professorId: survivorId },
  });

  // Transfer Attendance Sessions
  await prisma.attendanceSession.updateMany({
    where: { professorId: redundantId },
    data: { professorId: survivorId },
  });

  // Transfer Grades (markedBy)
  await prisma.grade.updateMany({
    where: { markedBy: redundantId },
    data: { markedBy: survivorId },
  });

  // Transfer Professor Settings (if redundant has them and survivor doesn't)
  const redundantSettings = await prisma.professorSettings.findUnique({ where: { professorId: redundantId } });
  if (redundantSettings) {
    const survivorSettings = await prisma.professorSettings.findUnique({ where: { professorId: survivorId } });
    if (!survivorSettings) {
      // Transfer if survivor has none
      await prisma.professorSettings.update({
        where: { professorId: redundantId },
        data: { professorId: survivorId },
      });
    } else {
      // Delete if survivor already has settings
      await prisma.professorSettings.delete({ where: { professorId: redundantId } });
    }
  }

  // Delete redundant account
  await prisma.user.delete({
    where: { id: redundantId },
  });
}

async function main() {
  console.log('--- 🚀 Smart Campus Professor Merge & Cleanup ---');

  // 1. Define Merge Mappings (Redundant -> Survivor)
  // Comprehensive list from the latest audit report (21 Groups)
  const mergeMappings = [
    // Existing/Previous mappings (some might be done but keeping for safety in case of partial runs)
    { redundant: '71', survivor: '27' },   // Walid Mohamed Milad
    { redundant: '80', survivor: '125' },  // Hazem Reza
    { redundant: '124', survivor: '79' },  // Alaa Abdel Hamid
    { redundant: '55', survivor: '107' },  // Gamal Hamdan (redundant 55 already gone maybe, adding new 106)
    { redundant: '106', survivor: '107' }, // Jamal Hamdan
    { redundant: '115', survivor: '119' }, // Iman Mohamed
    { redundant: '101', survivor: '34' },  // Iman Ramadan -> Primary 34
    { redundant: '83', survivor: '34' },   // Iman Ramadan -> Primary 34
    { redundant: '90', survivor: '34' },   // Iman Ramadan -> Primary 34
    { redundant: '102', survivor: '20' },  // Nourhan Ahmed
    { redundant: '17', survivor: '70' },   // Ahmed Mohamed
    { redundant: '89', survivor: '81' },   // Mahmoud Ahmed
    { redundant: '140', survivor: '33' },  // Hossam Mohamed -> Primary 33
    { redundant: '91', survivor: '33' },   // Hossam Mohamed -> Primary 33
    { redundant: '109', survivor: '19' },  // Mostafa Nasr -> Primary 19
    { redundant: '72', survivor: '19' },   // Mostafa Nasr -> Primary 19
    { redundant: '10', survivor: '118' },  // Waheed Adel
    { redundant: '139', survivor: '29' },  // Mohamed Khaled
    { redundant: '94', survivor: '98' },   // Ahmed Mohamed (Arabic)
    { redundant: '88', survivor: '64' },   // Hesham Salah
    { redundant: '104', survivor: '37' },  // Mohamed Ahmed -> Primary 37
    { redundant: '73', survivor: '37' },   // Mohamed Ahmed -> Primary 37
    { redundant: '49', survivor: '37' },   // Mohamed Ahmed -> Primary 37
    { redundant: '114', survivor: '47' },  // Jamal El Din
    { redundant: '13', survivor: '116' },  // Jala Mohamed
    { redundant: '9', survivor: '21' },    // Mohamed Ahmed (Group 16)
    { redundant: '65', survivor: '121' },  // Yehia Ali
    { redundant: '22', survivor: '8' },    // Amany Imam
    { redundant: '99', survivor: '61' },   // Mahmoud Ezzat
    { redundant: '6', survivor: '74' },    // Hassan Salah
    { redundant: '86', survivor: '3' },    // Shaimaa Ruby

    // Remaining from previous audit that weren't in the list above but were in my notes
    { redundant: '84', survivor: '87' },   // Amir Khalifa
    { redundant: '130', survivor: '54' },  // Mostafa Meshrafa
    { redundant: '28', survivor: '38' },   // Majdi Ahmed
    { redundant: '138', survivor: '78' },  // Al-Moatasem Bellah
    { redundant: '92', survivor: '117' },  // Nada Mohsen
  ];

  for (const mapping of mergeMappings) {
    try {
      await mergeProfessors(mapping.survivor, mapping.redundant);
    } catch (error) {
      console.error(`Failed to merge ${mapping.redundant}:`, (error as Error).message);
    }
  }

  // 2. Unify Naming for ALL Professors
  console.log('\nUpdating naming to binary format (First Last)...');
  const allProfessors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
  });

  for (const prof of allProfessors) {
    const binaryName = await normalizeName(prof.name);
    const parts = binaryName.split(' ');
    
    await prisma.user.update({
      where: { id: prof.id },
      data: {
        name: binaryName,
        firstName: parts[0],
        lastName: parts[1] || parts[0],
      },
    });
  }

  console.log('\n✅ Cleanup and Unification Complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "../src/lib/db";

async function main() {
  const alerts = await prisma.fraudAlert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Last 5 alerts:");
  console.dir(alerts, { depth: null });
  
  interface FraudMetadata {
    examId?: number;
    violationType?: string;
  }
  
  // also check if any have examId in metadata
  const examAlerts = alerts.filter(a => (a.metadata as FraudMetadata)?.examId !== undefined);
  console.log("Alerts with examId:", examAlerts.length);
  if (examAlerts.length > 0) {
      const meta = examAlerts[0].metadata as FraudMetadata;
      console.log("Sample examId:", meta.examId);
      
      // Test the prisma query
      const queryAlerts = await prisma.fraudAlert.findMany({
          where: {
              metadata: {
                  path: ['examId'],
                  equals: meta.examId
              }
          }
      });
      console.log("Query returned:", queryAlerts.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

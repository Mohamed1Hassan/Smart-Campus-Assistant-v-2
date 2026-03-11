/**
 * Utility to get a relevant image for a course based on its name and code.
 * Uses local images from public folder for better compatibility.
 */

// Map of keywords to specific images (using public folder paths)
const keywordImages: { [key: string]: string } = {
  // Applied Statistics
  "applied statistics": "/courses/applied-statistics.png",
  statistics: "/courses/applied-statistics.png",
  "statistical analysis": "/courses/applied-statistics.png",

  // Graduation Project
  "graduation project": "/courses/graduation-project.png",
  graduation: "/courses/graduation-project.png",
  capstone: "/courses/graduation-project.png",

  // Enterprise Information Systems
  "enterprise information systems":
    "/courses/enterprise-information-systems.png",
  "information systems": "/courses/enterprise-information-systems.png",

  // Computer Programming Applications
  "computer programming": "/courses/computer-programming.png",
  programming: "/courses/computer-programming.png",

  // Strategic Management
  "strategic management": "/courses/strategic-management.png",
  strategic: "/courses/strategic-management.png",

  // Business Analytics & Data Mining
  "business analytics": "/courses/business-analytics.png",
  analytics: "/courses/business-analytics.png",
  "data mining": "/courses/applied-statistics.png",

  // Accounting & Finance
  accounting: "/courses/strategic-management.png",
  auditing: "/courses/strategic-management.png",
  business: "/courses/business-analytics.png",
  management: "/courses/strategic-management.png",
  marketing:
    "https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=1000&auto=format&fit=crop",
  finance: "/courses/finance.png",
  "public finance": "/courses/finance.png",
  investment: "/courses/finance.png",
  economics: "/courses/finance.png",

  // Engineering
  engineering:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
  robot:
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
  electronics:
    "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1000&auto=format&fit=crop",

  // Arabic Keywords
  مالية:
    "https://images.unsplash.com/photo-1579621909532-9357152067dc?q=80&w=1000&auto=format&fit=crop",
  ماليه:
    "https://images.unsplash.com/photo-1579621909532-9357152067dc?q=80&w=1000&auto=format&fit=crop",
  اقتصاد:
    "https://images.unsplash.com/photo-1611974714014-486bc961fc3e?q=80&w=1000&auto=format&fit=crop",
  محاسبة:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
  محاسبه:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
  مشروع:
    "https://images.unsplash.com/photo-1525921429624-479b6a29d84c?q=80&w=1000&auto=format&fit=crop",
  تخرج: "https://images.unsplash.com/photo-1525921429624-479b6a29d84c?q=80&w=1000&auto=format&fit=crop",
  إحصاء:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
  برمجة:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop",
  نظم: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
  إدارة:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
  تسويق:
    "https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=1000&auto=format&fit=crop",
};

// Pool of generic high-quality images for fallbacks
const genericImages = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop", // Coding laptop
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop", // Students group
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop", // Coffee & Notes
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop", // Library
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop", // Books
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop", // Classroom
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop", // Planning
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop", // Digital
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop", // Tech abstract
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop", // Teamwork
];

/**
 * Returns a deterministic image URL based on course name and ID.
 * @param courseName Name of the course
 * @param courseId ID of the course (string or number)
 */
export const getCourseImage = (
  courseName: string,
  courseId: string | number,
): string => {
  const lowerName = courseName.toLowerCase();

  // 1. Check for specific keywords (prioritize longer, more specific keywords first)
  const sortedKeywords = Object.keys(keywordImages).sort(
    (a, b) => b.length - a.length,
  );

  for (const keyword of sortedKeywords) {
    if (lowerName.includes(keyword)) {
      return keywordImages[keyword];
    }
  }

  // 2. If no keyword match, use deterministic hash of ID to pick from generic pool
  const idString = String(courseId);
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    hash = (hash << 5) - hash + idString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % genericImages.length;
  return genericImages[index];
};

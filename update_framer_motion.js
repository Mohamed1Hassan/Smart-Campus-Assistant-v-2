const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'views', 'StudentCourses.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace import
content = content.replace('import { motion } from "framer-motion";', 'import { m, LazyMotion, domAnimation } from "framer-motion";');

// Replace all <motion.
content = content.replace(/<motion\./g, '<m.');
// Replace all </motion.
content = content.replace(/<\/motion\./g, '</m.');

// Wrap the main content with LazyMotion
content = content.replace('<DashboardLayout userName={user?.firstName} userType="student">', '<DashboardLayout userName={user?.firstName} userType="student">\n      <LazyMotion features={domAnimation}>');
// we need to be careful with the end tag, let's just replace the single closing DashboardLayout
content = content.replace('    </DashboardLayout>', '      </LazyMotion>\n    </DashboardLayout>');

fs.writeFileSync(file, content);
console.log('Update complete!');

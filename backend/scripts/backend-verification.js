/**
 * COMPREHENSIVE BACKEND VERIFICATION SCRIPT
 * 
 * This script performs end-to-end verification of the entire backend system:
 * - Database connection and schema validation
 * - API endpoint verification
 * - Security checks
 * - File upload system verification
 * - Logic error detection
 * - Final report generation
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readdir } from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Report structure
const report = {
  timestamp: new Date().toISOString(),
  database: {
    connection: { status: "PENDING", issues: [] },
    tables: { status: "PENDING", missing: [], accessible: [], issues: [] },
    columns: { status: "PENDING", missing: [], typeMismatches: [], issues: [] },
    foreignKeys: { status: "PENDING", missing: [], issues: [] },
    indexes: { status: "PENDING", missing: [], issues: [] },
  },
  endpoints: {
    status: "PENDING",
    routes: [],
    issues: [],
    missingControllers: [],
    validationIssues: [],
  },
  security: {
    status: "PENDING",
    jwt: { status: "PENDING", issues: [] },
    authMiddleware: { status: "PENDING", issues: [] },
    rbac: { status: "PENDING", issues: [] },
    issues: [],
  },
  uploads: {
    status: "PENDING",
    endpoints: [],
    issues: [],
  },
  logic: {
    status: "PENDING",
    issues: [],
    columnNameMismatches: [],
    missingWhereClauses: [],
    paginationIssues: [],
  },
  fixes: [],
  grade: "PENDING",
};

// Expected tables based on codebase analysis
const EXPECTED_TABLES = [
  "profiles",
  "roles",
  "projects",
  "bids",
  "jobs",
  "job_applications",
  "contractors",
  "conversations",
  "messages",
  "notifications",
  "milestones",
  "payments",
  "payouts",
  "reviews",
  "disputes",
  "sessions",
  "login_logs",
  "failed_logins",
  "admin_logs",
  "appointments",
  "progress_updates",
  "uploads",
  "saved_contractors",
  "quotes",
  "referrals",
];

// Expected columns for key tables
const EXPECTED_COLUMNS = {
  profiles: [
    "id", "email", "first_name", "last_name", "phone_number", "role_id",
    "role_code", "account_type", "status", "email_verified", "created_at",
    "updated_at", "profile_picture", "bio", "is_verified", "is_deleted"
  ],
  roles: ["id", "role_code", "name", "type", "created_at"],
  projects: [
    "id", "title", "description", "status", "created_by", "user_id",
    "contractor_id", "created_at", "updated_at"
  ],
  bids: [
    "id", "project_id", "contractor_id", "amount", "status", "created_at"
  ],
  jobs: [
    "id", "title", "description", "status", "created_by", "user_id",
    "created_at", "updated_at"
  ],
};

/**
 * 1. DATABASE VERIFICATION
 */
async function verifyDatabase() {
  console.log("\n=========================================");
  console.log("1. DATABASE VERIFICATION");
  console.log("=========================================\n");

  // Test connection
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
    report.database.connection.status = "PASS";
    console.log("✅ Database connection: PASS");
  } catch (error) {
    report.database.connection.status = "FAIL";
    report.database.connection.issues.push(error.message);
    console.log("❌ Database connection: FAIL -", error.message);
    return;
  }

  // Check tables
  console.log("\nChecking tables...");
  for (const table of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        if (error.code === "42P01") {
          // Table does not exist
          report.database.tables.missing.push(table);
          console.log(`❌ Table missing: ${table}`);
        } else {
          report.database.tables.issues.push({ table, error: error.message });
          console.log(`⚠️  Table ${table} has issues: ${error.message}`);
        }
      } else {
        report.database.tables.accessible.push(table);
        console.log(`✅ Table accessible: ${table}`);
      }
    } catch (error) {
      report.database.tables.issues.push({ table, error: error.message });
      console.log(`⚠️  Error checking table ${table}: ${error.message}`);
    }
  }

  // Check columns
  console.log("\nChecking columns...");
  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    try {
      // Get actual columns from database
      const { data: schemaData, error: schemaError } = await supabase.rpc(
        "get_table_columns",
        { table_name: table }
      ).catch(async () => {
        // Fallback: try to query information_schema directly
        const { data, error } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type")
          .eq("table_name", table)
          .eq("table_schema", "public");
        return { data, error };
      });

      // Alternative: Try a test query with all expected columns
      const testColumns = columns.slice(0, 5).join(", "); // Test first 5 columns
      const { error: testError } = await supabase
        .from(table)
        .select(testColumns)
        .limit(0);

      if (testError && testError.message.includes("column")) {
        // Extract missing column from error
        const missingCol = columns.find(col => 
          testError.message.toLowerCase().includes(col.toLowerCase())
        );
        if (missingCol) {
          report.database.columns.missing.push({ table, column: missingCol });
          console.log(`❌ Missing column: ${table}.${missingCol}`);
        }
      } else {
        console.log(`✅ Columns check passed for: ${table}`);
      }
    } catch (error) {
      console.log(`⚠️  Error checking columns for ${table}: ${error.message}`);
    }
  }

  // Set status
  if (
    report.database.tables.missing.length === 0 &&
    report.database.columns.missing.length === 0 &&
    report.database.tables.issues.length === 0
  ) {
    report.database.tables.status = "PASS";
    report.database.columns.status = "PASS";
  } else {
    report.database.tables.status = "FAIL";
    report.database.columns.status = "FAIL";
  }
}

/**
 * 2. API ENDPOINT SCAN
 */
async function verifyEndpoints() {
  console.log("\n=========================================");
  console.log("2. API ENDPOINT SCAN & VALIDATION");
  console.log("=========================================\n");

  const routesDir = path.join(__dirname, "../src/routes");
  const controllersDir = path.join(__dirname, "../src/controllers");

  // Scan route files
  try {
    const routeFiles = await readdir(routesDir);
    console.log(`Found ${routeFiles.length} route files`);

    for (const file of routeFiles) {
      if (!file.endsWith(".js")) continue;

      const routePath = path.join(routesDir, file);
      const routeContent = fs.readFileSync(routePath, "utf-8");

      // Extract route definitions
      const routeMatches = routeContent.matchAll(
        /router\.(get|post|put|delete|patch)\(["']([^"']+)["']/g
      );

      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const path = match[2];
        const handler = extractHandler(routeContent, match[0]);

        report.endpoints.routes.push({
          file,
          method,
          path,
          handler,
          status: "PENDING",
        });
      }
    }

    console.log(`✅ Scanned ${report.endpoints.routes.length} routes`);
  } catch (error) {
    console.log(`❌ Error scanning routes: ${error.message}`);
    report.endpoints.issues.push(`Route scan error: ${error.message}`);
  }

  // Check controllers exist
  for (const route of report.endpoints.routes) {
    if (route.handler) {
      const controllerPath = path.join(
        controllersDir,
        `${route.handler}.js`
      );
      if (!fs.existsSync(controllerPath)) {
        // Check if it's in a subdirectory
        const subdirs = ["bids", "contractors", "conversations", "disputes", 
                        "jobs", "milestones", "notifications", "payments", 
                        "projects", "reviews", "uploads", "progress"];
        
        let found = false;
        for (const subdir of subdirs) {
          const subPath = path.join(__dirname, `../src/${subdir}/${route.handler}.js`);
          if (fs.existsSync(subPath)) {
            found = true;
            break;
          }
        }

        if (!found) {
          report.endpoints.missingControllers.push({
            route: `${route.method} ${route.path}`,
            handler: route.handler,
          });
          console.log(`❌ Missing controller: ${route.handler}`);
        }
      }
    }
  }

  if (report.endpoints.missingControllers.length === 0) {
    report.endpoints.status = "PASS";
  } else {
    report.endpoints.status = "FAIL";
  }
}

function extractHandler(content, routeLine) {
  // Try to extract handler function name
  const handlerMatch = content.match(
    new RegExp(routeLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*,\\s*([a-zA-Z_$][a-zA-Z0-9_$]*)")
  );
  return handlerMatch ? handlerMatch[1] : null;
}

/**
 * 3. SECURITY CHECK
 */
async function verifySecurity() {
  console.log("\n=========================================");
  console.log("3. SECURITY CHECK");
  console.log("=========================================\n");

  // Check JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    report.security.jwt.status = "FAIL";
    report.security.jwt.issues.push("JWT_SECRET not set in environment");
    console.log("❌ JWT_SECRET not configured");
  } else {
    report.security.jwt.status = "PASS";
    console.log("✅ JWT_SECRET configured");
  }

  // Check auth middleware
  const authMiddlewarePath = path.join(__dirname, "../src/middlewares/auth.js");
  if (fs.existsSync(authMiddlewarePath)) {
    const authContent = fs.readFileSync(authMiddlewarePath, "utf-8");
    
    if (authContent.includes("jwt.verify")) {
      report.security.authMiddleware.status = "PASS";
      console.log("✅ Auth middleware uses JWT verification");
    } else {
      report.security.authMiddleware.status = "FAIL";
      report.security.authMiddleware.issues.push("Auth middleware missing JWT verification");
      console.log("❌ Auth middleware missing JWT verification");
    }
  } else {
    report.security.authMiddleware.status = "FAIL";
    report.security.authMiddleware.issues.push("Auth middleware file not found");
    console.log("❌ Auth middleware file not found");
  }

  // Check RBAC middleware
  const rbacFiles = [
    "role.js",
    "permission.js",
    "requireAdmin.js"
  ];

  for (const file of rbacFiles) {
    const rbacPath = path.join(__dirname, `../src/middlewares/${file}`);
    if (fs.existsSync(rbacPath)) {
      console.log(`✅ RBAC middleware found: ${file}`);
    } else {
      report.security.rbac.issues.push(`Missing RBAC middleware: ${file}`);
      console.log(`❌ Missing RBAC middleware: ${file}`);
    }
  }

  if (report.security.jwt.status === "PASS" && 
      report.security.authMiddleware.status === "PASS" &&
      report.security.rbac.issues.length === 0) {
    report.security.status = "PASS";
  } else {
    report.security.status = "FAIL";
  }
}

/**
 * 4. FILE UPLOAD SYSTEM CHECK
 */
async function verifyUploads() {
  console.log("\n=========================================");
  console.log("4. FILE UPLOAD SYSTEM CHECK");
  console.log("=========================================\n");

  // Check upload routes
  const uploadRoutesPath = path.join(__dirname, "../src/uploads/uploadRoutes.js");
  if (fs.existsSync(uploadRoutesPath)) {
    const uploadContent = fs.readFileSync(uploadRoutesPath, "utf-8");
    
    if (uploadContent.includes("router.post") || uploadContent.includes("router.put")) {
      report.uploads.endpoints.push("Upload endpoint exists");
      console.log("✅ Upload endpoint found");
    }
  } else {
    report.uploads.issues.push("Upload routes file not found");
    console.log("❌ Upload routes file not found");
  }

  // Check upload controller
  const uploadControllerPath = path.join(__dirname, "../src/uploads/uploadController.js");
  if (fs.existsSync(uploadControllerPath)) {
    const controllerContent = fs.readFileSync(uploadControllerPath, "utf-8");
    
    if (controllerContent.includes("multer") || controllerContent.includes("supabase.storage")) {
      console.log("✅ Upload controller configured");
    } else {
      report.uploads.issues.push("Upload controller missing multer/storage config");
      console.log("⚠️  Upload controller may be missing multer/storage config");
    }
  } else {
    report.uploads.issues.push("Upload controller file not found");
    console.log("❌ Upload controller file not found");
  }

  if (report.uploads.issues.length === 0) {
    report.uploads.status = "PASS";
  } else {
    report.uploads.status = "FAIL";
  }
}

/**
 * 5. LOGIC VERIFICATION
 */
async function verifyLogic() {
  console.log("\n=========================================");
  console.log("5. LOGIC VERIFICATION");
  console.log("=========================================\n");

  // Scan controllers for common issues
  const controllersDir = path.join(__dirname, "../src/controllers");
  const subdirs = ["bids", "contractors", "conversations", "disputes", 
                   "jobs", "milestones", "notifications", "payments", 
                   "projects", "reviews", "uploads", "progress"];

  const allControllers = [];

  // Get controllers from main directory
  try {
    const files = await readdir(controllersDir);
    allControllers.push(...files.filter(f => f.endsWith(".js")).map(f => 
      path.join(controllersDir, f)
    ));
  } catch (error) {
    console.log(`⚠️  Error reading controllers directory: ${error.message}`);
  }

  // Get controllers from subdirectories
  for (const subdir of subdirs) {
    const subdirPath = path.join(__dirname, `../src/${subdir}`);
    try {
      const files = await readdir(subdirPath);
      allControllers.push(...files
        .filter(f => f.endsWith("Controller.js"))
        .map(f => path.join(subdirPath, f))
      );
    } catch (error) {
      // Subdirectory might not exist, that's okay
    }
  }

  // Check each controller for issues
  for (const controllerPath of allControllers) {
    try {
      const content = fs.readFileSync(controllerPath, "utf-8");
      const fileName = path.basename(controllerPath);

      // Check for common column name issues
      if (content.includes("user_id") && content.includes("created_by")) {
        // Both used - might be inconsistent
        const user_id_count = (content.match(/user_id/g) || []).length;
        const created_by_count = (content.match(/created_by/g) || []).length;
        if (user_id_count > 0 && created_by_count > 0) {
          report.logic.columnNameMismatches.push({
            file: fileName,
            issue: "Both user_id and created_by used - may be inconsistent",
          });
        }
      }

      // Check for missing WHERE clauses in updates/deletes
      const updateMatches = content.matchAll(/\.update\([^)]+\)(?![\s\S]*?\.eq\(|\.neq\(|\.in\(|\.gt\(|\.lt\()/g);
      for (const match of updateMatches) {
        const lineNum = content.substring(0, match.index).split("\n").length;
        report.logic.missingWhereClauses.push({
          file: fileName,
          line: lineNum,
          issue: "Update query may be missing WHERE clause",
        });
      }

      // Check for pagination issues
      if (content.includes(".select(") && !content.includes(".range(") && 
          !content.includes(".limit(") && content.includes("getAll") || content.includes("list")) {
        report.logic.paginationIssues.push({
          file: fileName,
          issue: "List endpoint may be missing pagination",
        });
      }

    } catch (error) {
      console.log(`⚠️  Error checking controller ${controllerPath}: ${error.message}`);
    }
  }

  if (report.logic.columnNameMismatches.length === 0 &&
      report.logic.missingWhereClauses.length === 0 &&
      report.logic.paginationIssues.length === 0) {
    report.logic.status = "PASS";
  } else {
    report.logic.status = "FAIL";
    console.log(`⚠️  Found ${report.logic.columnNameMismatches.length} column name mismatches`);
    console.log(`⚠️  Found ${report.logic.missingWhereClauses.length} potential missing WHERE clauses`);
    console.log(`⚠️  Found ${report.logic.paginationIssues.length} pagination issues`);
  }
}

/**
 * 6. GENERATE FINAL REPORT
 */
function generateReport() {
  console.log("\n=========================================");
  console.log("6. GENERATING FINAL REPORT");
  console.log("=========================================\n");

  // Calculate grade
  let score = 0;
  let maxScore = 0;

  // Database (30 points)
  maxScore += 30;
  if (report.database.connection.status === "PASS") score += 10;
  if (report.database.tables.status === "PASS") score += 10;
  if (report.database.columns.status === "PASS") score += 10;

  // Endpoints (25 points)
  maxScore += 25;
  if (report.endpoints.status === "PASS") score += 25;

  // Security (25 points)
  maxScore += 25;
  if (report.security.status === "PASS") score += 25;

  // Uploads (10 points)
  maxScore += 10;
  if (report.uploads.status === "PASS") score += 10;

  // Logic (10 points)
  maxScore += 10;
  if (report.logic.status === "PASS") score += 10;

  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) report.grade = "A";
  else if (percentage >= 80) report.grade = "B";
  else if (percentage >= 70) report.grade = "C";
  else if (percentage >= 60) report.grade = "D";
  else report.grade = "F";

  // Generate SQL fixes if needed
  if (report.database.tables.missing.length > 0 || report.database.columns.missing.length > 0) {
    generateSQLFixes();
  }

  // Save report
  const reportPath = path.join(__dirname, "../BACKEND_VERIFICATION_FINAL_REPORT.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  generateMarkdownReport();

  console.log(`\n✅ Final Grade: ${report.grade} (${percentage.toFixed(1)}%)`);
  console.log(`📄 Report saved to: ${reportPath}`);
}

function generateSQLFixes() {
  const sqlFixes = [];

  // Generate CREATE TABLE statements for missing tables
  for (const table of report.database.tables.missing) {
    // This would need to be customized based on actual schema requirements
    sqlFixes.push(`-- TODO: Create table ${table}`);
  }

  // Generate ALTER TABLE statements for missing columns
  for (const { table, column } of report.database.columns.missing) {
    sqlFixes.push(`-- TODO: ALTER TABLE ${table} ADD COLUMN ${column} <TYPE>;`);
  }

  if (sqlFixes.length > 0) {
    const sqlPath = path.join(__dirname, "../migrations/fix_missing_schema.sql");
    fs.writeFileSync(sqlPath, sqlFixes.join("\n"));
    report.fixes.push(`SQL fixes generated: ${sqlPath}`);
  }
}

function generateMarkdownReport() {
  const mdPath = path.join(__dirname, "../BACKEND_VERIFICATION_FINAL_REPORT.md");
  
  let md = `# Backend Verification Final Report\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `**Final Grade:** ${report.grade}\n\n`;
  
  md += `## 1. Database Verification\n\n`;
  md += `- Connection: ${report.database.connection.status}\n`;
  md += `- Tables: ${report.database.tables.status}\n`;
  md += `- Columns: ${report.database.columns.status}\n\n`;
  
  if (report.database.tables.missing.length > 0) {
    md += `### Missing Tables:\n`;
    report.database.tables.missing.forEach(t => md += `- ${t}\n`);
  }
  
  if (report.database.columns.missing.length > 0) {
    md += `### Missing Columns:\n`;
    report.database.columns.missing.forEach(({ table, column }) => 
      md += `- ${table}.${column}\n`
    );
  }
  
  md += `\n## 2. API Endpoints\n\n`;
  md += `- Status: ${report.endpoints.status}\n`;
  md += `- Total Routes: ${report.endpoints.routes.length}\n\n`;
  
  md += `\n## 3. Security\n\n`;
  md += `- JWT: ${report.security.jwt.status}\n`;
  md += `- Auth Middleware: ${report.security.authMiddleware.status}\n`;
  md += `- RBAC: ${report.security.rbac.issues.length === 0 ? "PASS" : "FAIL"}\n\n`;
  
  md += `\n## 4. File Uploads\n\n`;
  md += `- Status: ${report.uploads.status}\n\n`;
  
  md += `\n## 5. Logic Issues\n\n`;
  md += `- Column Name Mismatches: ${report.logic.columnNameMismatches.length}\n`;
  md += `- Missing WHERE Clauses: ${report.logic.missingWhereClauses.length}\n`;
  md += `- Pagination Issues: ${report.logic.paginationIssues.length}\n\n`;
  
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown report saved to: ${mdPath}`);
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log("=========================================");
  console.log("BACKEND FULL VERIFICATION STARTING");
  console.log("=========================================");

  try {
    await verifyDatabase();
    await verifyEndpoints();
    await verifySecurity();
    await verifyUploads();
    await verifyLogic();
    generateReport();

    console.log("\n=========================================");
    console.log("BACKEND FULL VERIFICATION COMPLETE");
    console.log("=========================================");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

// Run verification
main();


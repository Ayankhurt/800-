/**
 * COMPREHENSIVE SCHEMA VERIFICATION ENGINE
 * Uses provided database schema as source of truth
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readdir, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the provided database schema
const dbSchema = {
  tables: new Set(),
  columns: {}, // { table: { column: data_type } }
};

// Initialize schema from provided data
const tablesData = [
  { "table_name": "admin_activity_logs" },
  { "table_name": "ai_generated_contracts" },
  { "table_name": "ai_progress_analysis" },
  { "table_name": "announcements" },
  { "table_name": "assignments" },
  { "table_name": "bid_submissions" },
  { "table_name": "bids" },
  { "table_name": "blocked_ips" },
  { "table_name": "change_orders" },
  { "table_name": "contractor_profiles" },
  { "table_name": "conversation_participants" },
  { "table_name": "conversations" },
  { "table_name": "ddos_logs" },
  { "table_name": "device_tokens" },
  { "table_name": "dispute_messages" },
  { "table_name": "disputes" },
  { "table_name": "documents" },
  { "table_name": "email_campaigns" },
  { "table_name": "email_verification_tokens" },
  { "table_name": "escrow_accounts" },
  { "table_name": "failed_logins" },
  { "table_name": "job_applications" },
  { "table_name": "jobs" },
  { "table_name": "login_logs" },
  { "table_name": "messages" },
  { "table_name": "milestones" },
  { "table_name": "moderation_queue" },
  { "table_name": "notifications" },
  { "table_name": "password_reset_logs" },
  { "table_name": "password_reset_tokens" },
  { "table_name": "payments" },
  { "table_name": "payouts" },
  { "table_name": "permissions" },
  { "table_name": "profiles" },
  { "table_name": "progress_updates" },
  { "table_name": "project_milestones" },
  { "table_name": "projects" },
  { "table_name": "review_reports" },
  { "table_name": "reviews" },
  { "table_name": "role_permissions" },
  { "table_name": "roles" },
  { "table_name": "sessions" },
  { "table_name": "support_ticket_messages" },
  { "table_name": "support_tickets" },
  { "table_name": "system_settings" },
  { "table_name": "transactions" }
];

// Load columns data from JSON file
let columnsData = [];
try {
  columnsData = JSON.parse(fs.readFileSync(path.join(__dirname, "../schema-columns.json"), "utf-8"));
} catch (error) {
  console.error("Error loading schema-columns.json:", error.message);
  process.exit(1);
}

// Initialize schema
tablesData.forEach(t => dbSchema.tables.add(t.table_name));
columnsData.forEach(c => {
  if (!dbSchema.columns[c.table_name]) {
    dbSchema.columns[c.table_name] = {};
  }
  dbSchema.columns[c.table_name][c.column_name] = c.data_type;
});

console.log(`✅ Loaded ${dbSchema.tables.size} tables and ${columnsData.length} columns from schema`);

// Track issues
const issues = {
  missingTables: [], // { file, line, table, code }
  missingColumns: [], // { file, line, table, column, code, fix }
  wrongColumnNames: [], // { file, line, table, wrong, correct, code, fix }
  unusedColumns: {}, // { table: [columns] }
  typeMismatches: [], // { file, line, table, column, codeType, dbType, code, fix }
  wrongJoins: [], // { file, line, table1, col1, table2, col2, code, fix }
};

// Track code usage
const codeUsage = {
  tables: new Set(),
  columns: {}, // { table: Set(columns) }
};

/**
 * Scan entire codebase
 */
async function scanCodebase() {
  console.log("\n=========================================");
  console.log("SCANNING BACKEND CODEBASE");
  console.log("=========================================\n");

  const srcDir = path.join(__dirname, "../src");
  await scanDirectory(srcDir, ["node_modules", ".git", "uploads"]);

  console.log(`✅ Scanned codebase`);
  console.log(`✅ Found ${codeUsage.tables.size} tables referenced in code`);
}

async function scanDirectory(dir, ignoreDirs = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, ignoreDirs);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        await scanFile(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

async function scanFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const relativePath = path.relative(path.join(__dirname, "../"), filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Detect .from("table")
      const fromMatch = line.match(/\.from\(["']([^"']+)["']\)/);
      if (fromMatch) {
        const table = fromMatch[1];
        codeUsage.tables.add(table);
        if (!codeUsage.columns[table]) {
          codeUsage.columns[table] = new Set();
        }

        // Check if table exists in schema
        if (!dbSchema.tables.has(table)) {
          issues.missingTables.push({
            file: relativePath,
            line: lineNum,
            table: table,
            code: line.trim(),
          });
        }
      }

      // Detect column usage in various contexts
      if (fromMatch) {
        const table = fromMatch[1];
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 10)).join("\n");

        // Extract columns from .select()
        const selectMatches = context.matchAll(/\.select\(["']([^"']+)["']\)/g);
        for (const match of selectMatches) {
          const selectClause = match[1];
          if (selectClause !== "*" && !selectClause.includes("(")) {
            const cols = selectClause.split(",").map(c => c.trim().split(" ")[0].split("(")[0]);
            cols.forEach(col => {
              if (col && col !== "*") {
                checkColumn(relativePath, lineNum, table, col, context);
              }
            });
          }
        }

        // Extract from .insert({ ... })
        const insertMatch = context.match(/(?:\.insert|\.upsert)\(({[^}]+})\)/s);
        if (insertMatch) {
          const objStr = insertMatch[1];
          const keyMatches = objStr.matchAll(/(\w+)\s*:/g);
          for (const match of keyMatches) {
            const col = match[1];
            checkColumn(relativePath, lineNum, table, col, context);
          }
        }

        // Extract from .update({ ... })
        const updateMatch = context.match(/\.update\(({[^}]+})\)/s);
        if (updateMatch) {
          const objStr = updateMatch[1];
          const keyMatches = objStr.matchAll(/(\w+)\s*:/g);
          for (const match of keyMatches) {
            const col = match[1];
            checkColumn(relativePath, lineNum, table, col, context);
          }
        }

        // Extract from .eq("column"), .neq("column"), etc.
        const filterMatches = context.matchAll(/\.(eq|neq|in|like|ilike|gte|lte|gt|lt|is)\(["']([^"']+)["']/g);
        for (const match of filterMatches) {
          const col = match[2];
          checkColumn(relativePath, lineNum, table, col, context);
        }

        // Extract from .order("column")
        const orderMatch = context.match(/\.order\(["']([^"']+)["']/);
        if (orderMatch) {
          const col = orderMatch[1];
          checkColumn(relativePath, lineNum, table, col, context);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

function checkColumn(file, line, table, column, context) {
  if (!dbSchema.tables.has(table)) return; // Table doesn't exist, already reported

  codeUsage.columns[table]?.add(column);

  if (!dbSchema.columns[table] || !dbSchema.columns[table][column]) {
    // Column doesn't exist - check for common naming variations
    const variations = findColumnVariations(table, column);
    if (variations.length > 0) {
      issues.wrongColumnNames.push({
        file,
        line,
        table,
        wrong: column,
        correct: variations[0],
        code: context.split("\n").slice(0, 3).join("\n"),
        fix: `Replace "${column}" with "${variations[0]}"`,
      });
    } else {
      issues.missingColumns.push({
        file,
        line,
        table,
        column,
        code: context.split("\n").slice(0, 3).join("\n"),
        fix: `Add column "${column}" to table "${table}" or use correct column name`,
      });
    }
  }
}

function findColumnVariations(table, column) {
  if (!dbSchema.columns[table]) return [];
  const dbColumns = Object.keys(dbSchema.columns[table]);
  const lower = column.toLowerCase();

  // Try exact match (case insensitive)
  const exact = dbColumns.find(c => c.toLowerCase() === lower);
  if (exact) return [exact];

  // Try common variations
  const variations = [];
  if (lower.includes("_id")) {
    const base = lower.replace("_id", "");
    variations.push(...dbColumns.filter(c => c.toLowerCase().includes(base)));
  }
  if (lower.endsWith("_at")) {
    const base = lower.replace("_at", "");
    variations.push(...dbColumns.filter(c => c.toLowerCase().includes(base)));
  }

  return variations.slice(0, 3); // Return top 3 matches
}

/**
 * Compare and generate reports
 */
function generateReports() {
  console.log("\n=========================================");
  console.log("GENERATING REPORTS");
  console.log("=========================================\n");

  // Find unused columns
  for (const [table, columns] of Object.entries(dbSchema.columns)) {
    const used = codeUsage.columns[table] || new Set();
    const unused = Object.keys(columns).filter(col => !used.has(col));
    if (unused.length > 0) {
      issues.unusedColumns[table] = unused;
    }
  }

  // Generate mismatch report
  generateMismatchReport();
  
  // Generate SQL migration
  generateSQLMigration();
}

function generateMismatchReport() {
  let report = `# COMPREHENSIVE SCHEMA VERIFICATION REPORT\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Source of Truth:** Provided Supabase Database Schema\n\n`;

  report += `## SUMMARY\n\n`;
  report += `- Tables in DB: ${dbSchema.tables.size}\n`;
  report += `- Tables used in code: ${codeUsage.tables.size}\n`;
  report += `- Missing tables: ${issues.missingTables.length}\n`;
  report += `- Missing columns: ${issues.missingColumns.length}\n`;
  report += `- Wrong column names: ${issues.wrongColumnNames.length}\n`;
  report += `- Unused columns: ${Object.keys(issues.unusedColumns).length} tables\n\n`;

  // Missing tables
  if (issues.missingTables.length > 0) {
    report += `## 1. MISSING TABLES (Used in code but not in DB)\n\n`;
    const grouped = {};
    issues.missingTables.forEach(issue => {
      if (!grouped[issue.table]) grouped[issue.table] = [];
      grouped[issue.table].push(issue);
    });
    Object.entries(grouped).forEach(([table, instances]) => {
      report += `### Table: \`${table}\`\n\n`;
      report += `**Used in:** ${instances.length} location(s)\n\n`;
      instances.slice(0, 5).forEach(inst => {
        report += `- **File:** \`${inst.file}\` (Line ${inst.line})\n`;
        report += `  \`\`\`javascript\n  ${inst.code}\n  \`\`\`\n\n`;
      });
      if (instances.length > 5) {
        report += `- ... and ${instances.length - 5} more locations\n\n`;
      }
    });
  }

  // Missing columns
  if (issues.missingColumns.length > 0) {
    report += `## 2. MISSING COLUMNS (Used in code but not in DB)\n\n`;
    const grouped = {};
    issues.missingColumns.forEach(issue => {
      const key = `${issue.table}.${issue.column}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    });
    Object.entries(grouped).forEach(([key, instances]) => {
      const [table, column] = key.split(".");
      report += `### \`${table}.${column}\`\n\n`;
      report += `**Used in:** ${instances.length} location(s)\n\n`;
      instances.slice(0, 3).forEach(inst => {
        report += `- **File:** \`${inst.file}\` (Line ${inst.line})\n`;
        report += `  \`\`\`javascript\n  ${inst.code}\n  \`\`\`\n`;
        report += `  **Fix:** ${inst.fix}\n\n`;
      });
    });
  }

  // Wrong column names
  if (issues.wrongColumnNames.length > 0) {
    report += `## 3. WRONG COLUMN NAMES (Code uses wrong name)\n\n`;
    const grouped = {};
    issues.wrongColumnNames.forEach(issue => {
      const key = `${issue.table}.${issue.wrong}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    });
    Object.entries(grouped).forEach(([key, instances]) => {
      const inst = instances[0];
      report += `### \`${inst.table}.${inst.wrong}\` → Should be \`${inst.correct}\`\n\n`;
      report += `**Used in:** ${instances.length} location(s)\n\n`;
      inst.code.split("\n").slice(0, 3).forEach(line => {
        report += `\`\`\`javascript\n${line.replace(inst.wrong, `**${inst.wrong}** → ${inst.correct}`)}\n\`\`\`\n\n`;
      });
    });
  }

  // Unused columns
  if (Object.keys(issues.unusedColumns).length > 0) {
    report += `## 4. UNUSED COLUMNS (Exist in DB but never used in code)\n\n`;
    Object.entries(issues.unusedColumns).forEach(([table, columns]) => {
      report += `### \`${table}\`\n\n`;
      report += `Columns: ${columns.join(", ")}\n\n`;
    });
  }

  const reportPath = path.join(__dirname, "../SCHEMA_MISMATCH_REPORT.md");
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Mismatch report saved to: ${reportPath}`);
}

function generateSQLMigration() {
  let sql = `-- ============================================
-- SCHEMA FIXES MIGRATION
-- Auto-generated from codebase verification
-- Generated: ${new Date().toISOString()}
-- ============================================

`;

  // Add missing columns
  const missingColsGrouped = {};
  issues.missingColumns.forEach(issue => {
    const key = `${issue.table}.${issue.column}`;
    if (!missingColsGrouped[key]) {
      missingColsGrouped[key] = issue;
    }
  });

  Object.values(missingColsGrouped).forEach(issue => {
    sql += `-- Add missing column: ${issue.table}.${issue.column}\n`;
    const type = inferColumnType(issue.column);
    sql += `ALTER TABLE ${issue.table} ADD COLUMN IF NOT EXISTS ${issue.column} ${type};\n\n`;
  });

  // Rename wrong columns (if we have correct names)
  const wrongColsGrouped = {};
  issues.wrongColumnNames.forEach(issue => {
    const key = `${issue.table}.${issue.wrong}`;
    if (!wrongColsGrouped[key]) {
      wrongColsGrouped[key] = issue;
    }
  });

  Object.values(wrongColsGrouped).forEach(issue => {
    sql += `-- Rename column: ${issue.table}.${issue.wrong} → ${issue.correct}\n`;
    sql += `-- NOTE: Manual review required - this may break existing data\n`;
    sql += `-- ALTER TABLE ${issue.table} RENAME COLUMN ${issue.wrong} TO ${issue.correct};\n\n`;
  });

  const sqlPath = path.join(__dirname, "../schema_fixes_migration.sql");
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ SQL migration saved to: ${sqlPath}`);
}

function inferColumnType(columnName) {
  const lower = columnName.toLowerCase();
  if (lower.includes("id") && (lower.endsWith("_id") || lower === "id")) return "UUID";
  if (lower.includes("email")) return "VARCHAR(255)";
  if (lower.includes("password") || lower.includes("token")) return "VARCHAR(255)";
  if (lower.includes("phone")) return "VARCHAR(50)";
  if (lower.includes("status") || lower.includes("type")) return "VARCHAR(50)";
  if (lower.includes("amount") || lower.includes("price") || lower.includes("budget")) return "NUMERIC(12,2)";
  if (lower.includes("count") || lower.includes("number")) return "INTEGER";
  if (lower.includes("created_at") || lower.includes("updated_at") || lower.includes("_at")) {
    return "TIMESTAMP WITH TIME ZONE";
  }
  if (lower.includes("enabled") || lower.includes("verified") || lower.includes("is_") || lower.includes("read")) {
    return "BOOLEAN DEFAULT false";
  }
  if (lower.includes("description") || lower.includes("notes") || lower.includes("message")) {
    return "TEXT";
  }
  if (lower.includes("data") || lower.includes("metadata")) return "JSONB";
  return "TEXT";
}

/**
 * MAIN
 */
async function main() {
  console.log("=========================================");
  console.log("COMPREHENSIVE SCHEMA VERIFICATION");
  console.log("=========================================");

  // First, save the columns data to a file for easy loading
  // (In real scenario, this would be passed as parameter)
  
  await scanCodebase();
  generateReports();

  console.log("\n=========================================");
  console.log("VERIFICATION COMPLETE");
  console.log("=========================================");
  console.log(`\n📄 Reports generated:`);
  console.log(`   - SCHEMA_MISMATCH_REPORT.md`);
  console.log(`   - schema_fixes_migration.sql`);
}

main().catch(console.error);


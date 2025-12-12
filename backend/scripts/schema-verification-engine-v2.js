/**
 * BACKEND SCHEMA VERIFICATION ENGINE V2
 * Improved column detection with better table context tracking
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readdir, readFile } from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const codeSchema = {
  tables: new Set(),
  columns: {}, // { table: Set(columns) }
  inserts: {}, // { table: { columns: Set } }
  updates: {}, // { table: { columns: Set } }
  selects: {}, // { table: { columns: Set } }
  foreignKeys: [],
};

const dbSchema = {
  tables: [],
  columns: {},
};

const issues = {
  missingTables: [],
  missingColumns: [],
  unusedTables: [],
};

/**
 * PHASE 1: SCAN CODEBASE WITH IMPROVED CONTEXT TRACKING
 */
async function scanCodebase() {
  console.log("\n=========================================");
  console.log("PHASE 1: SCANNING BACKEND CODEBASE");
  console.log("=========================================\n");

  const srcDir = path.join(__dirname, "../src");
  await scanDirectory(srcDir, ["node_modules", ".git"]);

  console.log(`✅ Found ${codeSchema.tables.size} tables in code`);
  
  // Merge all column sources
  for (const table of codeSchema.tables) {
    const allColumns = new Set();
    if (codeSchema.inserts[table]) allColumns.add(...codeSchema.inserts[table].columns);
    if (codeSchema.updates[table]) allColumns.add(...codeSchema.updates[table].columns);
    if (codeSchema.selects[table]) allColumns.add(...codeSchema.selects[table].columns);
    codeSchema.columns[table] = allColumns;
  }
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
        await scanFileImproved(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

async function scanFileImproved(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    let currentTable = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect .from("table")
      const fromMatch = line.match(/\.from\(["']([^"']+)["']\)/);
      if (fromMatch) {
        currentTable = fromMatch[1];
        codeSchema.tables.add(currentTable);
        
        if (!codeSchema.inserts[currentTable]) codeSchema.inserts[currentTable] = { columns: new Set() };
        if (!codeSchema.updates[currentTable]) codeSchema.updates[currentTable] = { columns: new Set() };
        if (!codeSchema.selects[currentTable]) codeSchema.selects[currentTable] = { columns: new Set() };
        if (!codeSchema.columns[currentTable]) codeSchema.columns[currentTable] = new Set();
      }
      
      if (!currentTable) continue;
      
      // Detect .insert({ ... })
      const insertMatch = line.match(/\.insert\(({[^}]+})\)/s);
      if (insertMatch) {
        const objStr = insertMatch[1];
        const keyMatches = objStr.matchAll(/(\w+)\s*:/g);
        for (const match of keyMatches) {
          const col = match[1];
          codeSchema.inserts[currentTable].columns.add(col);
          codeSchema.columns[currentTable].add(col);
        }
      }
      
      // Detect .update({ ... })
      const updateMatch = line.match(/\.update\(({[^}]+})\)/s);
      if (updateMatch) {
        const objStr = updateMatch[1];
        const keyMatches = objStr.matchAll(/(\w+)\s*:/g);
        for (const match of keyMatches) {
          const col = match[1];
          codeSchema.updates[currentTable].columns.add(col);
          codeSchema.columns[currentTable].add(col);
        }
      }
      
      // Detect .select("col1, col2") - only extract columns for current table, not joins
      const selectMatch = line.match(/\.select\(["']([^"']+)["']\)/);
      if (selectMatch && !selectMatch[1].includes("(")) {
        // Simple select without joins
        const cols = selectMatch[1].split(",").map(c => c.trim().split(" ")[0]);
        cols.forEach(col => {
          if (col && col !== "*") {
            codeSchema.selects[currentTable].columns.add(col);
            codeSchema.columns[currentTable].add(col);
          }
        });
      }
      
      // Detect .eq("column"), .neq("column"), etc.
      const filterMatches = line.matchAll(/\.(eq|neq|in|like|ilike|gte|lte|gt|lt)\(["']([^"']+)["']/g);
      for (const match of filterMatches) {
        const col = match[2];
        codeSchema.columns[currentTable].add(col);
      }
      
      // Detect .order("column")
      const orderMatch = line.match(/\.order\(["']([^"']+)["']/);
      if (orderMatch) {
        const col = orderMatch[1];
        codeSchema.columns[currentTable].add(col);
      }
    }
  } catch (error) {
    // File might not be readable
  }
}

/**
 * PHASE 2: QUERY DATABASE
 */
async function queryDatabaseSchema() {
  console.log("\n=========================================");
  console.log("PHASE 2: QUERYING DATABASE SCHEMA");
  console.log("=========================================\n");

  // Query tables by trying to access them
  const knownTables = Array.from(codeSchema.tables);
  
  for (const table of knownTables) {
    try {
      const { data, error } = await supabase.from(table).select("id").limit(1);
      if (!error) {
        dbSchema.tables.push(table);
        
        // Get column info from sample data
        const { data: sample } = await supabase.from(table).select("*").limit(1);
        if (sample && sample.length > 0) {
          dbSchema.columns[table] = Object.keys(sample[0]).map(col => ({
            name: col,
            type: inferType(sample[0][col]),
          }));
        }
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  console.log(`✅ Verified ${dbSchema.tables.length} tables exist in database`);
}

function inferType(value) {
  if (value === null || value === undefined) return "unknown";
  if (typeof value === "string") {
    if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return "uuid";
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return "timestamp";
    return "text";
  }
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "numeric";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "jsonb";
  return "text";
}

/**
 * PHASE 3: COMPARE
 */
function compareSchemas() {
  console.log("\n=========================================");
  console.log("PHASE 3: COMPARING CODE vs DATABASE");
  console.log("=========================================\n");

  for (const table of codeSchema.tables) {
    if (!dbSchema.tables.includes(table)) {
      issues.missingTables.push(table);
    } else {
      // Check columns
      const dbColumns = (dbSchema.columns[table] || []).map(c => c.name);
      const codeColumns = Array.from(codeSchema.columns[table] || []);
      
      for (const col of codeColumns) {
        if (!dbColumns.includes(col) && col !== "*") {
          issues.missingColumns.push({ table, column: col });
        }
      }
    }
  }

  for (const table of dbSchema.tables) {
    if (!codeSchema.tables.has(table)) {
      issues.unusedTables.push(table);
    }
  }

  console.log(`❌ Missing tables: ${issues.missingTables.length}`);
  console.log(`❌ Missing columns: ${issues.missingColumns.length}`);
  console.log(`⚠️  Unused tables: ${issues.unusedTables.length}`);
}

/**
 * PHASE 4: GENERATE SQL FIXES
 */
function generateSQLFixes() {
  console.log("\n=========================================");
  console.log("PHASE 4: GENERATING SQL FIX FILE");
  console.log("=========================================\n");

  let sql = `-- ============================================
-- BACKEND SCHEMA FIXES
-- Auto-generated from codebase scan
-- Generated: ${new Date().toISOString()}
-- ============================================

`;

  // CREATE TABLE for missing tables
  for (const table of issues.missingTables) {
    sql += `-- Create table: ${table}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    
    const columns = Array.from(codeSchema.columns[table] || []);
    const addedCols = new Set(["id"]);
    
    for (const col of columns) {
      if (col !== "id" && !addedCols.has(col)) {
        const type = inferColumnType(col, table);
        sql += `  ${col} ${type},\n`;
        addedCols.add(col);
      }
    }
    
    // Add standard columns if not present
    if (!columns.includes("created_at")) {
      sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
    }
    if (!columns.includes("updated_at")) {
      sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
    }
    
    sql = sql.replace(/,\n$/, "\n"); // Remove trailing comma
    sql += `);\n\n`;
  }

  // ALTER TABLE for missing columns
  const grouped = {};
  issues.missingColumns.forEach(({ table, column }) => {
    if (!grouped[table]) grouped[table] = [];
    grouped[table].push(column);
  });

  for (const [table, cols] of Object.entries(grouped)) {
    if (!issues.missingTables.includes(table)) {
      for (const col of cols) {
        sql += `-- Add missing column: ${table}.${col}\n`;
        const type = inferColumnType(col, table);
        sql += `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type};\n\n`;
      }
    }
  }

  // Add indexes for frequently used columns
  for (const table of codeSchema.tables) {
    const columns = Array.from(codeSchema.columns[table] || []);
    const indexCandidates = ["id", "user_id", "created_by", "project_id", "status", "email"];
    
    for (const col of indexCandidates) {
      if (columns.includes(col) && (dbSchema.tables.includes(table) || issues.missingTables.includes(table))) {
        sql += `-- Index: ${table}.${col}\n`;
        sql += `CREATE INDEX IF NOT EXISTS idx_${table}_${col} ON ${table}(${col});\n\n`;
      }
    }
  }

  const sqlPath = path.join(__dirname, "../schema_fixes.sql");
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ SQL fixes saved to: ${sqlPath}`);
  
  return sql;
}

function inferColumnType(columnName, table) {
  if (!columnName || typeof columnName !== "string") return "TEXT";
  const lower = columnName.toLowerCase();
  
  if (lower.includes("id") && (lower.endsWith("_id") || lower === "id")) return "UUID";
  if (lower.includes("email")) return "VARCHAR(255)";
  if (lower.includes("password") || lower.includes("token")) return "VARCHAR(255)";
  if (lower.includes("phone")) return "VARCHAR(50)";
  if (lower.includes("status") || lower.includes("type") || lower.includes("role")) return "VARCHAR(50)";
  if (lower.includes("amount") || lower.includes("price") || lower.includes("budget")) return "NUMERIC(12,2)";
  if (lower.includes("count") || lower.includes("number") || lower.includes("order_number")) return "INTEGER";
  if (lower.includes("created_at") || lower.includes("updated_at") || lower.includes("_at")) {
    return "TIMESTAMP WITH TIME ZONE";
  }
  if (lower.includes("enabled") || lower.includes("verified") || lower.includes("is_") || lower.includes("read")) {
    return "BOOLEAN DEFAULT false";
  }
  if (lower.includes("description") || lower.includes("notes") || lower.includes("message") || lower.includes("reason")) {
    return "TEXT";
  }
  if (lower.includes("data") || lower.includes("metadata") || lower.includes("requirements") || lower.includes("details")) {
    return "JSONB";
  }
  if (lower.includes("images") || lower.includes("tags")) return "TEXT[]";
  
  return "TEXT";
}

/**
 * PHASE 5: GENERATE REPORT
 */
function generateReport() {
  console.log("\n=========================================");
  console.log("PHASE 5: GENERATING FINAL REPORT");
  console.log("=========================================\n");

  let report = `# BACKEND SCHEMA VERIFICATION REPORT\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  report += `## 1. TABLES FOUND IN CODE\n\n`;
  report += `Total: ${codeSchema.tables.size}\n\n`;
  Array.from(codeSchema.tables).sort().forEach(table => {
    const colCount = codeSchema.columns[table]?.size || 0;
    report += `- ${table} (${colCount} columns detected)\n`;
  });

  report += `\n## 2. TABLES FOUND IN DATABASE\n\n`;
  report += `Total: ${dbSchema.tables.length}\n\n`;
  dbSchema.tables.sort().forEach(table => {
    report += `- ${table}\n`;
  });

  report += `\n## 3. MISSING TABLES\n\n`;
  if (issues.missingTables.length === 0) {
    report += `✅ No missing tables\n\n`;
  } else {
    report += `Total: ${issues.missingTables.length}\n\n`;
    issues.missingTables.forEach(table => {
      const cols = Array.from(codeSchema.columns[table] || []);
      report += `- **${table}** (${cols.length} columns detected in code)\n`;
      cols.slice(0, 10).forEach(col => report += `  - ${col}\n`);
      if (cols.length > 10) report += `  - ... and ${cols.length - 10} more\n`;
    });
  }

  report += `\n## 4. MISSING COLUMNS\n\n`;
  if (issues.missingColumns.length === 0) {
    report += `✅ No missing columns\n\n`;
  } else {
    report += `Total: ${issues.missingColumns.length}\n\n`;
    const grouped = {};
    issues.missingColumns.forEach(({ table, column }) => {
      if (!grouped[table]) grouped[table] = [];
      grouped[table].push(column);
    });
    Object.entries(grouped).forEach(([table, cols]) => {
      report += `### ${table}\n`;
      cols.forEach(col => report += `- ${col}\n`);
      report += `\n`;
    });
  }

  report += `\n## 5. UNUSED TABLES\n\n`;
  if (issues.unusedTables.length === 0) {
    report += `✅ No unused tables\n\n`;
  } else {
    report += `Total: ${issues.unusedTables.length}\n\n`;
    issues.unusedTables.forEach(table => {
      report += `- ${table}\n`;
    });
  }

  // Health score
  let score = 100;
  score -= issues.missingTables.length * 10;
  score -= issues.missingColumns.length * 2;
  score = Math.max(0, score);

  let grade = "A";
  if (score < 90) grade = "B";
  if (score < 80) grade = "C";
  if (score < 70) grade = "D";
  if (score < 60) grade = "F";

  report += `\n## 6. SCHEMA HEALTH SCORE\n\n`;
  report += `**Score:** ${score}/100\n`;
  report += `**Grade:** ${grade}\n\n`;

  report += `\n## 7. FIXES GENERATED\n\n`;
  report += `SQL fixes have been generated in: \`schema_fixes.sql\`\n\n`;

  const reportPath = path.join(__dirname, "../SCHEMA_VERIFICATION_REPORT.md");
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Report saved to: ${reportPath}`);

  return report;
}

/**
 * MAIN
 */
async function main() {
  console.log("=========================================");
  console.log("BACKEND SCHEMA VERIFICATION ENGINE V2");
  console.log("=========================================");

  try {
    await scanCodebase();
    await queryDatabaseSchema();
    compareSchemas();
    generateSQLFixes();
    generateReport();

    console.log("\n=========================================");
    console.log("SCHEMA VERIFICATION COMPLETE");
    console.log("=========================================");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main();


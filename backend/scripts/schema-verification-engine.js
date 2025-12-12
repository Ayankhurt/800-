/**
 * BACKEND SCHEMA VERIFICATION ENGINE
 * 
 * Scans codebase, queries database, compares, and generates SQL fixes
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

// Storage for discovered schema
const codeSchema = {
  tables: new Set(),
  columns: {}, // { table: Set(columns) }
  foreignKeys: [], // { fromTable, fromColumn, toTable, toColumn }
  indexes: [], // { table, column, type }
};

const dbSchema = {
  tables: [],
  columns: {}, // { table: [{ name, type }] }
};

const issues = {
  missingTables: [],
  missingColumns: [],
  unusedTables: [],
  unusedColumns: [],
  typeMismatches: [],
};

/**
 * PHASE 1: SCAN BACKEND CODEBASE
 */
async function scanCodebase() {
  console.log("\n=========================================");
  console.log("PHASE 1: SCANNING BACKEND CODEBASE");
  console.log("=========================================\n");

  const srcDir = path.join(__dirname, "../src");
  
  // Scan all directories
  await scanDirectory(srcDir, ["node_modules", ".git"]);

  console.log(`✅ Found ${codeSchema.tables.size} tables in code`);
  console.log(`✅ Found columns for ${Object.keys(codeSchema.columns).length} tables`);
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
    
    // Extract table names from .from("table")
    const fromMatches = content.matchAll(/\.from\(["']([^"']+)["']\)/g);
    for (const match of fromMatches) {
      const table = match[1];
      codeSchema.tables.add(table);
      
      if (!codeSchema.columns[table]) {
        codeSchema.columns[table] = new Set();
      }
    }

    // Extract column names from various patterns
    // Pattern: .select("col1, col2") or .select('col1, col2')
    const selectMatches = content.matchAll(/\.select\(["']([^"']+)["']\)/g);
    for (const match of selectMatches) {
      const selectClause = match[1];
      // Extract column names (handle * and nested selects)
      if (selectClause !== "*") {
        const cols = selectClause.split(",").map(c => c.trim().split(" ")[0].split("(")[0]);
        cols.forEach(col => {
          if (col && !col.includes("(") && col !== "*") {
            // Try to find which table this belongs to
            const lines = content.substring(0, match.index).split("\n");
            const currentLine = lines[lines.length - 1];
            const tableMatch = currentLine.match(/\.from\(["']([^"']+)["']\)/);
            if (tableMatch) {
              const table = tableMatch[1];
              if (!codeSchema.columns[table]) {
                codeSchema.columns[table] = new Set();
              }
              codeSchema.columns[table].add(col);
            }
          }
        });
      }
    }

    // Extract column names from .eq("column"), .update({ column: value }), etc.
    const columnPatterns = [
      /\.eq\(["']([^"']+)["']/g,
      /\.neq\(["']([^"']+)["']/g,
      /\.in\(["']([^"']+)["']/g,
      /\.like\(["']([^"']+)["']/g,
      /\.ilike\(["']([^"']+)["']/g,
      /\.gte\(["']([^"']+)["']/g,
      /\.lte\(["']([^"']+)["']/g,
      /\.gt\(["']([^"']+)["']/g,
      /\.lt\(["']([^"']+)["']/g,
      /\.order\(["']([^"']+)["']/g,
    ];

    for (const pattern of columnPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const col = match[1];
        // Find the table context
        const beforeMatch = content.substring(0, match.index);
        const tableMatch = beforeMatch.match(/\.from\(["']([^"']+)["']\)/);
        if (tableMatch) {
          const table = tableMatch[tableMatch.length - 1];
          if (!codeSchema.columns[table]) {
            codeSchema.columns[table] = new Set();
          }
          codeSchema.columns[table].add(col);
        }
      }
    }

    // Extract from .insert({ column: value }) and .update({ column: value })
    const insertUpdateMatches = content.matchAll(/(?:\.insert|\.update)\(({[^}]+})\)/gs);
    for (const match of insertUpdateMatches) {
      const objStr = match[1];
      // Extract keys from object
      const keyMatches = objStr.matchAll(/(\w+)\s*:/g);
      for (const keyMatch of keyMatches) {
        const col = keyMatch[1];
        // Find table context
        const beforeMatch = content.substring(0, match.index);
        const tableMatch = beforeMatch.match(/\.from\(["']([^"']+)["']\)/);
        if (tableMatch) {
          const table = tableMatch[tableMatch.length - 1];
          if (!codeSchema.columns[table]) {
            codeSchema.columns[table] = new Set();
          }
          codeSchema.columns[table].add(col);
        }
      }
    }

    // Extract foreign key relationships from joins
    const joinMatches = content.matchAll(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/g);
    for (const match of joinMatches) {
      const table1 = match[1];
      const col1 = match[2];
      const table2 = match[3];
      const col2 = match[4];
      
      if (codeSchema.tables.has(table1) && codeSchema.tables.has(table2)) {
        codeSchema.foreignKeys.push({
          fromTable: table1,
          fromColumn: col1,
          toTable: table2,
          toColumn: col2,
        });
      }
    }

    // Extract indexes from .order() calls
    const orderMatches = content.matchAll(/\.order\(["']([^"']+)["']/g);
    for (const match of orderMatches) {
      const col = match[1];
      const beforeMatch = content.substring(0, match.index);
      const tableMatch = beforeMatch.match(/\.from\(["']([^"']+)["']\)/);
      if (tableMatch) {
        const table = tableMatch[tableMatch.length - 1];
        codeSchema.indexes.push({ table, column: col, type: "btree" });
      }
    }

  } catch (error) {
    // File might not be readable
  }
}

/**
 * PHASE 2: QUERY DATABASE SCHEMA
 */
async function queryDatabaseSchema() {
  console.log("\n=========================================");
  console.log("PHASE 2: QUERYING DATABASE SCHEMA");
  console.log("=========================================\n");

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      // Alternative: Try querying known tables directly
      console.log("⚠️  Cannot query information_schema, using alternative method...");
      await queryTablesAlternative();
      return;
    }

    if (tables) {
      dbSchema.tables = tables.map(t => t.table_name);
      console.log(`✅ Found ${dbSchema.tables.length} tables in database`);
    }

    // Get all columns
    for (const table of dbSchema.tables.slice(0, 50)) { // Limit to avoid timeout
      try {
        const { data: sample, error } = await supabase
          .from(table)
          .select("*")
          .limit(1);
        
        if (!error && sample && sample.length > 0) {
          dbSchema.columns[table] = Object.keys(sample[0]).map(col => ({
            name: col,
            type: inferType(sample[0][col]),
          }));
        }
      } catch (e) {
        // Table might not be accessible
      }
    }

  } catch (error) {
    console.log(`⚠️  Error querying schema: ${error.message}`);
    await queryTablesAlternative();
  }
}

async function queryTablesAlternative() {
  // Try to query known tables directly
  const knownTables = Array.from(codeSchema.tables);
  
  for (const table of knownTables) {
    try {
      const { data, error } = await supabase.from(table).select("id").limit(1);
      if (!error) {
        dbSchema.tables.push(table);
        
        // Try to get column info
        const { data: sample } = await supabase.from(table).select("*").limit(1);
        if (sample && sample.length > 0) {
          dbSchema.columns[table] = Object.keys(sample[0]).map(col => ({
            name: col,
            type: inferType(sample[0][col]),
          }));
        }
      }
    } catch (e) {
      // Table doesn't exist or not accessible
    }
  }
  
  console.log(`✅ Verified ${dbSchema.tables.length} tables exist in database`);
}

function inferType(value) {
  if (value === null || value === undefined) return "unknown";
  if (typeof value === "string") {
    if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return "uuid";
    }
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return "timestamp";
    }
    return "text";
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return "integer";
    return "numeric";
  }
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "jsonb";
  return "text";
}

/**
 * PHASE 3: COMPARE CODE vs DATABASE
 */
function compareSchemas() {
  console.log("\n=========================================");
  console.log("PHASE 3: COMPARING CODE vs DATABASE");
  console.log("=========================================\n");

  // Find missing tables
  for (const table of codeSchema.tables) {
    if (!dbSchema.tables.includes(table)) {
      issues.missingTables.push(table);
    }
  }

  // Find missing columns
  for (const [table, columns] of Object.entries(codeSchema.columns)) {
    if (dbSchema.tables.includes(table)) {
      const dbColumns = (dbSchema.columns[table] || []).map(c => c.name);
      for (const col of columns) {
        if (!dbColumns.includes(col)) {
          issues.missingColumns.push({ table, column: col });
        }
      }
    }
  }

  // Find unused tables
  for (const table of dbSchema.tables) {
    if (!codeSchema.tables.has(table)) {
      issues.unusedTables.push(table);
    }
  }

  // Find unused columns (simplified - would need full column list from DB)
  // This is complex without full schema query, so we'll skip for now

  console.log(`❌ Missing tables: ${issues.missingTables.length}`);
  console.log(`❌ Missing columns: ${issues.missingColumns.length}`);
  console.log(`⚠️  Unused tables: ${issues.unusedTables.length}`);
}

/**
 * PHASE 4: GENERATE SQL FIX FILE
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

  // Generate CREATE TABLE for missing tables
  for (const table of issues.missingTables) {
    sql += `-- Create table: ${table}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    
    // Add columns from code
    if (codeSchema.columns[table]) {
      const columns = Array.from(codeSchema.columns[table]);
      for (const col of columns) {
        if (col !== "id") {
          const type = inferColumnType(col, table);
          sql += `  ${col} ${type},\n`;
        }
      }
    }
    
    sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
    sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
    sql += `);\n\n`;
  }

  // Generate ALTER TABLE for missing columns
  for (const { table, column } of issues.missingColumns) {
    if (!issues.missingTables.includes(table)) {
      sql += `-- Add missing column: ${table}.${column}\n`;
      const type = inferColumnType(column, table);
      sql += `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type};\n\n`;
    }
  }

  // Generate indexes
  for (const { table, column } of codeSchema.indexes) {
    if (dbSchema.tables.includes(table) || issues.missingTables.includes(table)) {
      sql += `-- Create index: ${table}.${column}\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});\n\n`;
    }
  }

  // Generate foreign keys
  for (const fk of codeSchema.foreignKeys) {
    if (dbSchema.tables.includes(fk.fromTable) && dbSchema.tables.includes(fk.toTable)) {
      sql += `-- Add foreign key: ${fk.fromTable}.${fk.fromColumn} -> ${fk.toTable}.${fk.toColumn}\n`;
      sql += `ALTER TABLE ${fk.fromTable} ADD CONSTRAINT IF NOT EXISTS fk_${fk.fromTable}_${fk.fromColumn} `;
      sql += `FOREIGN KEY (${fk.fromColumn}) REFERENCES ${fk.toTable}(${fk.toColumn});\n\n`;
    }
  }

  const sqlPath = path.join(__dirname, "../schema_fixes.sql");
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ SQL fixes saved to: ${sqlPath}`);
  
  return sql;
}

function inferColumnType(columnName, table) {
  const lower = columnName.toLowerCase();
  
  // Common patterns
  if (lower.includes("id") && (lower.endsWith("_id") || lower === "id")) {
    return "UUID";
  }
  if (lower.includes("email")) return "VARCHAR(255)";
  if (lower.includes("password") || lower.includes("token")) return "VARCHAR(255)";
  if (lower.includes("phone")) return "VARCHAR(50)";
  if (lower.includes("status")) return "VARCHAR(50)";
  if (lower.includes("type")) return "VARCHAR(50)";
  if (lower.includes("amount") || lower.includes("price") || lower.includes("budget")) return "NUMERIC(12,2)";
  if (lower.includes("count") || lower.includes("number")) return "INTEGER";
  if (lower.includes("created_at") || lower.includes("updated_at") || lower.includes("_at")) {
    return "TIMESTAMP WITH TIME ZONE";
  }
  if (lower.includes("enabled") || lower.includes("verified") || lower.includes("is_")) {
    return "BOOLEAN DEFAULT false";
  }
  if (lower.includes("description") || lower.includes("notes") || lower.includes("message")) {
    return "TEXT";
  }
  if (lower.includes("data") || lower.includes("metadata") || lower.includes("requirements")) {
    return "JSONB";
  }
  if (lower.includes("images") || lower.includes("tags")) {
    return "TEXT[]";
  }
  
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
    report += `- ${table}\n`;
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
      report += `- ${table}\n`;
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

  report += `\n## 5. UNUSED TABLES (in DB but not in code)\n\n`;
  if (issues.unusedTables.length === 0) {
    report += `✅ No unused tables\n\n`;
  } else {
    report += `Total: ${issues.unusedTables.length}\n\n`;
    issues.unusedTables.forEach(table => {
      report += `- ${table}\n`;
    });
  }

  report += `\n## 6. COLUMNS DETECTED IN CODE\n\n`;
  Object.entries(codeSchema.columns).forEach(([table, columns]) => {
    report += `### ${table}\n`;
    Array.from(columns).sort().forEach(col => {
      report += `- ${col}\n`;
    });
    report += `\n`;
  });

  // Calculate health score
  let score = 100;
  score -= issues.missingTables.length * 10;
  score -= issues.missingColumns.length * 2;
  score = Math.max(0, score);

  let grade = "A";
  if (score < 90) grade = "B";
  if (score < 80) grade = "C";
  if (score < 70) grade = "D";
  if (score < 60) grade = "F";

  report += `\n## 7. SCHEMA HEALTH SCORE\n\n`;
  report += `**Score:** ${score}/100\n`;
  report += `**Grade:** ${grade}\n\n`;

  report += `\n## 8. FIXES GENERATED\n\n`;
  report += `SQL fixes have been generated in: \`schema_fixes.sql\`\n\n`;
  report += `The file contains:\n`;
  report += `- CREATE TABLE statements for missing tables\n`;
  report += `- ALTER TABLE statements for missing columns\n`;
  report += `- CREATE INDEX statements for performance\n`;
  report += `- ALTER TABLE statements for foreign keys\n\n`;

  const reportPath = path.join(__dirname, "../SCHEMA_VERIFICATION_REPORT.md");
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Report saved to: ${reportPath}`);

  return report;
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log("=========================================");
  console.log("BACKEND SCHEMA VERIFICATION ENGINE");
  console.log("=========================================");

  try {
    await scanCodebase();
    await queryDatabaseSchema();
    compareSchemas();
    const sql = generateSQLFixes();
    const report = generateReport();

    console.log("\n=========================================");
    console.log("SCHEMA VERIFICATION COMPLETE");
    console.log("=========================================");
    console.log(`\n✅ Tables in code: ${codeSchema.tables.size}`);
    console.log(`✅ Tables in DB: ${dbSchema.tables.length}`);
    console.log(`❌ Missing tables: ${issues.missingTables.length}`);
    console.log(`❌ Missing columns: ${issues.missingColumns.length}`);
    console.log(`⚠️  Unused tables: ${issues.unusedTables.length}`);
    console.log(`\n📄 SQL fixes: schema_fixes.sql`);
    console.log(`📄 Report: SCHEMA_VERIFICATION_REPORT.md`);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main();


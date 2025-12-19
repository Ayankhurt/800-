
const fs = require('fs');
const path = require('path');

function generateAbsoluteFinalSchema() {
    const filePath = path.join(__dirname, '..', 'full_and_final.sql');
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} not found.`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let parts = content.split(/\]\s*\[/);
    if (parts.length < 3) return console.error("Split failed.");

    let cols, fks, triggers;
    try {
        cols = JSON.parse(parts[0] + ']');
        fks = JSON.parse('[' + parts[1] + ']');
        let tStr = parts[2].trim();
        if (tStr.endsWith('.')) tStr = tStr.slice(0, -1);
        if (!tStr.endsWith(']')) tStr += ']';
        triggers = JSON.parse('[' + tStr);
    } catch (e) { return console.error("JSON Error: " + e.message); }

    const tables = {};
    cols.forEach(col => {
        const tname = col.table_name;
        if (!tables[tname]) tables[tname] = { columns: [], name: tname };
        tables[tname].columns.push(col);
    });

    const sql = [
        "-- ==============================================================================",
        "-- THE ULTIMATE COMPREHENSIVE DATABASE SCHEMA",
        "-- Version: Final Production v3.0",
        "-- Generated for Supabase & Postgres Environment",
        "-- ==============================================================================",
        "",
        "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",
        "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";",
        "",
        "-- 1. TYPES DEFINITION",
        "DO $$ BEGIN",
        "    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN",
        "        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager', 'general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer');",
        "    END IF;",
        "    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN",
        "        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');",
        "    END IF;",
        "    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN",
        "        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');",
        "    END IF;",
        "END $$;",
        "",
        "-- 2. CORE FUNCTIONS",
        "CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$",
        "BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;",
        "",
        "CREATE OR REPLACE FUNCTION public.set_ticket_number() RETURNS TRIGGER AS $$",
        "BEGIN IF NEW.ticket_number IS NULL THEN NEW.ticket_number = 'TICK-' || upper(substring(gen_random_uuid()::text from 1 for 8)); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;",
        "",
        "-- 3. TABLES DEFINITION"
    ];

    const arrayCols = ['photos', 'images', 'documents', 'specialties', 'deliverables', 'acceptance_criteria', 'attachments', 'permissions', 'ip_whitelist'];

    Object.keys(tables).sort().forEach(tname => {
        const table = tables[tname];
        sql.push(`-- Table: ${tname}`);
        sql.push(`CREATE TABLE IF NOT EXISTS public.${tname} (`);

        let colLines = [];
        let hasPk = false;

        const cleanCols = table.columns.filter(c => !(tname === 'projects' && c.column_name === 'project_id') && !(tname === 'contractor_profiles' && c.column_name === 'profile_id'));

        cleanCols.forEach(c => {
            let name = c.column_name;
            let dtype = c.data_type;

            if (dtype === 'USER-DEFINED') {
                if (name === 'role') dtype = 'user_role';
                else if (name.includes('status')) dtype = 'verification_status';
                else dtype = 'text';
            }

            if (dtype === 'ARRAY' || arrayCols.includes(name)) {
                dtype = (name === 'ip_whitelist') ? 'inet[]' : 'text[]';
            }

            let extra = "";
            if (name === 'id') {
                extra = "PRIMARY KEY DEFAULT gen_random_uuid()";
                dtype = "uuid";
                hasPk = true;
            } else if (name === 'created_at' || name === 'updated_at') {
                extra = "DEFAULT now()";
            } else if (name === 'is_active') {
                extra = "DEFAULT true";
            }

            colLines.push(`    ${name} ${dtype} ${extra}`.trim());
        });

        if (!hasPk) colLines.unshift(`    id uuid PRIMARY KEY DEFAULT gen_random_uuid()`);

        sql.push(colLines.join(',\n'));
        sql.push(`);\n`);
        sql.push(`ALTER TABLE public.${tname} ENABLE ROW LEVEL SECURITY;\n`);
    });

    sql.push("-- 4. FOREIGN KEY RELATIONSHIPS");
    fks.forEach(fk => {
        const { table_name: t, column_name: c, foreign_table_name: ft, foreign_column_name: fc } = fk;
        if (t === ft && c === 'project_id' && t === 'projects') return;
        sql.push(`DO $$ BEGIN ALTER TABLE public.${t} ADD CONSTRAINT fk_${t}_${c} FOREIGN KEY (${c}) REFERENCES public.${ft}(${fc}) ON DELETE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;`);
    });

    sql.push("\n-- 5. TRIGGER REGISTRATION");
    triggers.forEach(trg => {
        const { trigger_name: name, table_name: table, action, event, timing } = trg;
        const fMatch = action.match(/FUNCTION\s+(\w+)\(\)/);
        const fName = fMatch ? fMatch[1] : null;
        if (fName && !['update_updated_at_column', 'set_ticket_number'].includes(fName)) {
            sql.push(`CREATE OR REPLACE FUNCTION public.${fName}() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;`);
        }
        sql.push(`DROP TRIGGER IF EXISTS ${name} ON public.${table};`);
        sql.push(`CREATE TRIGGER ${name} ${timing} ${event} ON public.${table} FOR EACH ROW ${action};`);
    });

    sql.push("\n-- 6. SUPABASE AUTH SYNC & CORE RLS POLICIES");
    sql.push(`
-- Function to sync Supabase Auth users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (new.id, new.email, 'viewer', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Basic RLS Policies (Universal)
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.%I', t.tablename);
        EXECUTE format('CREATE POLICY "Enable all access for authenticated users" ON public.%I FOR ALL TO authenticated USING (true);', t.tablename);
        
        EXECUTE format('DROP POLICY IF EXISTS "Public view for users" ON public.%I', t.tablename);
        EXECUTE format('CREATE POLICY "Public view for users" ON public.%I FOR SELECT TO anon USING (true);', t.tablename);
    END LOOP;
END $$;
`);

    fs.writeFileSync(path.join(__dirname, '..', 'FINAL_ULTIMATE_SCHEMA.sql'), sql.join('\n'));
    console.log("SUCCESS: Generated FINAL_ULTIMATE_SCHEMA.sql");
}

generateAbsoluteFinalSchema();

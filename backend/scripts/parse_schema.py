
import json
import os

def generate_schema():
    file_path = 'full_and_final.sql'
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The file contains 3 JSON arrays separated by " ] [" or "]["
    parts = content.split(' ] [')
    if len(parts) != 3:
        parts = content.split('][')
    
    if len(parts) != 3:
        # Fallback split for extra spaces or missing spaces
        import re
        parts = re.split(r'\]\s*\[', content)

    if len(parts) != 3:
        print(f"Split failed. Found {len(parts)} parts.")
        return

    try:
        cols = json.loads(parts[0] + ']')
        fks = json.loads('[' + parts[1] + ']')
        triggers = json.loads('[' + parts[2].rstrip('.').strip())
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return

    tables = {}
    for col in cols:
        tname = col['table_name']
        if tname not in tables:
            tables[tname] = []
        tables[tname].append(col)

    sql = [
        "-- ==============================================================================",
        "-- COMPREHENSIVE DATABASE SCHEMA",
        "-- Generated from full_and_final.sql",
        "-- ==============================================================================",
        "",
        "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",
        "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";",
        "",
        "-- 1. TYPES",
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
        "-- 2. COMMON FUNCTIONS",
        "CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$",
        "BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;",
        "",
        "CREATE OR REPLACE FUNCTION set_ticket_number() RETURNS TRIGGER AS $$",
        "BEGIN IF NEW.ticket_number IS NULL THEN NEW.ticket_number = 'TICK-' || upper(substring(gen_random_uuid()::text from 1 for 8)); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;",
        "",
        "-- 3. TABLES"
    ]

    for tname in sorted(tables.keys()):
        tcols = tables[tname]
        sql.append(f"-- Table: {tname}")
        sql.append(f"CREATE TABLE IF NOT EXISTS public.{tname} (")
        
        col_lines = []
        for c in tcols:
            name = c['column_name']
            dtype = c['data_type']
            
            if dtype == 'USER-DEFINED':
                if name == 'role': dtype = 'user_role'
                elif 'status' in name: dtype = 'verification_status'
                else: dtype = 'text'
            
            extra = ""
            if name == 'id':
                if dtype == 'uuid': extra = " PRIMARY KEY DEFAULT gen_random_uuid()"
                else: extra = " PRIMARY KEY GENERATED ALWAYS AS IDENTITY"
            elif name == 'created_at' or name == 'updated_at':
                extra = " DEFAULT now()"
            
            col_lines.append(f"    {name} {dtype}{extra}")
        
        sql.append(",\n".join(col_lines))
        sql.append(");\n")

    sql.append("-- 4. FOREIGN KEYS")
    for fk in fks:
        t = fk['table_name']
        c = fk['column_name']
        ft = fk['foreign_table_name']
        fc = fk['foreign_column_name']
        cons_name = f"fk_{t}_{c}_{ft}"
        sql.append(f"DO $$ BEGIN")
        sql.append(f"    ALTER TABLE public.{t} ADD CONSTRAINT {cons_name} FOREIGN KEY ({c}) REFERENCES public.{ft}({fc}) ON DELETE CASCADE;")
        sql.append(f"EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;")

    sql.append("\n-- 5. TRIGGERS")
    for trg in triggers:
        name = trg['trigger_name']
        table = trg['table_name']
        action = trg['action']
        event = trg['event']
        timing = trg['timing']
        sql.append(f"DROP TRIGGER IF EXISTS {name} ON public.{table};")
        sql.append(f"CREATE TRIGGER {name} {timing} {event} ON public.{table} FOR EACH ROW {action};")

    with open('final_schema_v2.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))
    print("SUCCESS: Generated final_schema_v2.sql")

if __name__ == '__main__':
    generate_schema()

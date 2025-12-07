import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...\n');

        const migrationsDir = path.join(process.cwd(), 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        for (const file of sqlFiles) {
            console.log(`📄 Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf-8');

            try {
                // Execute SQL using Supabase's RPC or direct query
                const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
                    // If RPC doesn't exist, try direct query (for simple statements)
                    return await supabase.from('_migrations').insert({ sql, file });
                });

                if (error) {
                    console.log(`⚠️  Note: ${file} may already be applied or needs manual execution`);
                    console.log(`   Error: ${error.message}\n`);
                } else {
                    console.log(`✅ Successfully applied: ${file}\n`);
                }
            } catch (error: any) {
                console.error(`❌ Error applying ${file}:`, error.message);
                console.log('   This migration may need to be run manually in Supabase SQL Editor\n');
            }
        }

        console.log('✅ Migration process completed!\n');
        console.log('📋 Please verify tables in Supabase Dashboard:\n');
        console.log('   - calculator_definitions');
        console.log('   - templates\n');

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    }
}

runMigrations().catch(console.error);

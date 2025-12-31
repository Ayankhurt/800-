import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateLimits() {
    const buckets = ['intro-videos', 'portfolios', 'progress-photos', 'documents'];

    console.log('Increasing Supabase Bucket limits to 100MB...');

    for (const bucketName of buckets) {
        const { data, error } = await supabase.storage.updateBucket(bucketName, {
            public: true,
            fileSizeLimit: 104857600, // 100MB
            allowedMimeTypes: ['image/*', 'video/*', 'application/pdf']
        });

        if (error) {
            console.error(`Error updating bucket ${bucketName}:`, error.message);
        } else {
            console.log(`Bucket ${bucketName} updated successfully.`);
        }
    }
}

updateLimits();

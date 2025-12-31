import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const buckets = [
    'intro-videos',
    'portfolios',
    'progress-photos',
    'documents',
    'avatars',
    'chat-attachments'
];

async function ensureBuckets() {
    console.log('Checking buckets...');

    for (const bucketName of buckets) {
        const { data, error } = await supabase.storage.getBucket(bucketName);

        if (error && error.message.includes('not found')) {
            console.log(`Creating bucket: ${bucketName}`);
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            });

            if (createError) {
                console.error(`Error creating bucket ${bucketName}:`, createError.message);
            } else {
                console.log(`Bucket ${bucketName} created successfully.`);
            }
        } else if (error) {
            console.error(`Error checking bucket ${bucketName}:`, error.message);
        } else {
            console.log(`Bucket ${bucketName} already exists.`);
        }
    }
}

ensureBuckets();

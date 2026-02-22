require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    try {
        // 1. Create a group
        const { data: gData, error: gError } = await supabase
            .from('premium_groups')
            .insert([{ name: '오토테스트방', password: '111', max_members: 200 }])
            .select()
            .single();

        if (gError) throw gError;
        console.log('✅ Created Test Group:', gData.id);

        // 2. Create homework entries for today
        const kstDateStr = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

        const hws = [
            {
                group_id: gData.id,
                student_name: '테스트용 학생A',
                description: '수학 숙제 완료했습니다.',
                image_urls: ['https://loremflickr.com/400/400?lock=1'],
                study_date: kstDateStr
            },
            {
                group_id: gData.id,
                student_name: '테스트용 학생B',
                description: '영어 단어 암기 50개',
                image_urls: ['https://loremflickr.com/400/400?lock=2', 'https://loremflickr.com/400/400?lock=3'],
                study_date: kstDateStr
            }
        ];

        const { error: hError } = await supabase.from('premium_homeworks').insert(hws);

        if (hError) throw hError;
        console.log('✅ Created Homework Entries');

        console.log('\n--- Test Information ---');
        console.log('Group Name: 오토테스트방');
        console.log('Password: 111');
        console.log('Group ID:', gData.id);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    }
}

seedData();

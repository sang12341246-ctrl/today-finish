import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 보안: Vercel Cron 요청 또는 인증된 키만 접근하도록 제한
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    // 로컬 테스트를 위해 임시로 해제하거나 Vercel Cron 헤더를 체크함
    // Vercel에서 CRON_SECRET 환경변수를 발급받아 설정해야 함
    if (
        process.env.NODE_ENV === 'production' &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // 1. 24시간 전에 생성되었고 아직 이미지가 삭제되지 않은 숙제 찾기
        const { data: targetHomeworks, error: fetchError } = await supabase
            .from('premium_homeworks')
            .select('id, image_urls')
            .lt('created_at', twentyFourHoursAgo.toISOString())
            .not('image_urls', 'is', null) // 이미지 배열이 있는 것만
            .neq('image_urls', '{}') // 빈 배열이 아닌 것만 (Postgres 배열 비교)

        if (fetchError) throw fetchError;

        if (!targetHomeworks || targetHomeworks.length === 0) {
            return NextResponse.json({ message: 'No old images to delete' });
        }

        let totalDeleted = 0;

        // 2. 스토리지에서 파일 지우고 DB 업데이트
        for (const homework of targetHomeworks) {
            const imageUrls = homework.image_urls as string[];
            if (imageUrls && imageUrls.length > 0) {
                const filePaths = imageUrls.map(url => {
                    const parts = url.split('/premium-photos/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(Boolean) as string[];

                if (filePaths.length > 0) {
                    await supabase.storage.from('premium-photos').remove(filePaths);
                }
            }

            // DB 업데이트: 이미지 배열 초기화 및 안내 문구 삽입
            await supabase
                .from('premium_homeworks')
                .update({
                    image_urls: [],
                    description: `[시스템 자동 정리 - 스토리지 확보를 위해 24시간이 경과된 사진이 영구 삭제되었습니다 💣]\n\n학생: `
                })
                .eq('id', homework.id);

            totalDeleted += imageUrls.length;
        }

        return NextResponse.json({
            message: `Successfully deleted ${totalDeleted} images from ${targetHomeworks.length} homeworks.`
        });

    } catch (error) {
        console.error('Auto-delete cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

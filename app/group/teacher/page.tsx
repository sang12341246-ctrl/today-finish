'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TeacherDashboardGrid } from '@/components/TeacherDashboardGrid';
import { PageTransition } from '@/components/PageTransition';

interface Homework {
    id: string;
    student_name: string;
    image_urls: string[];
    study_date: string;
    created_at: string;
}

export default function PremiumTeacherPage() {
    const router = useRouter();
    const [groupId, setGroupId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = localStorage.getItem('premium_group_id');
        const gName = localStorage.getItem('premium_group_name');

        if (!id) {
            router.push('/group/role-select');
            return;
        }

        setTimeout(() => {
            setGroupId(id);
            setGroupName(gName || '');
        }, 0);

        const fetchHomeworks = async () => {
            const today = new Date();
            const kstDateStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('premium_homeworks')
                .select('*')
                .eq('group_id', id)
                .eq('study_date', kstDateStr)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching homeworks:', error);
            } else if (data) {
                setHomeworks(data as Homework[]);
            }
            setLoading(false);
        };

        fetchHomeworks();

        // Subscribe to realtime inserts
        const channel = supabase
            .channel('public:premium_homeworks')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'premium_homeworks',
                    filter: `group_id=eq.${id}`,
                },
                (payload) => {
                    console.log('New homework received!', payload.new);
                    setHomeworks((prev) => [payload.new as Homework, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    return (
        <PageTransition>
            <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 pb-24">
                <div className="w-full max-w-5xl space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center justify-between pt-4">
                        <Link href="/group/role-select" className="text-gray-500 hover:text-gray-900 font-medium">
                            &larr; 역할 선택
                        </Link>
                        <div className="bg-blue-50 text-toss-blue text-sm px-4 py-1.5 rounded-full font-bold shadow-sm border border-blue-100 italic">
                            {groupName} 단체방 선생님
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                                실시간 숙제 대시보드 📊
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">
                                학생들이 숙제를 올리면 자동으로 화면에 나타납니다.
                            </p>
                        </div>

                        <div className="bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 flex items-center justify-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            실시간 연동 중
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-toss-blue border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                            <TeacherDashboardGrid homeworks={homeworks} />
                        </div>
                    )}
                </div>
            </main>
        </PageTransition>
    );
}

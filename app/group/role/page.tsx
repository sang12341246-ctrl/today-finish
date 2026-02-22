'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function GroupRolePage() {
    const router = useRouter();

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="text-center max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        역할 선택
                    </h1>
                    <p className="text-gray-500 text-lg">
                        입장하실 역할을 선택해주세요.
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <Button
                        onClick={() => router.push('/group/teacher')}
                        variant="primary"
                        fullWidth
                        className="text-xl py-6 rounded-3xl shadow-lg shadow-blue-500/20"
                    >
                        선생님 👩‍🏫
                    </Button>

                    <Button
                        onClick={() => router.push('/group/student')}
                        variant="secondary"
                        fullWidth
                        className="text-xl py-6 rounded-3xl"
                    >
                        학생 👨‍🎓
                    </Button>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { triggerConfetti, triggerSimpleConfetti } from '@/lib/confetti';
import imageCompression from 'browser-image-compression';
import { format, subDays, parseISO } from 'date-fns';

const MAX_IMAGES = 10;

export default function GroupStudentPage() {
    const router = useRouter();
    const [groupId, setGroupId] = useState('');
    const [groupName, setGroupName] = useState('');

    const [studentName, setStudentName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const [existingHwId, setExistingHwId] = useState<string | null>(null);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Gamification States
    const [streak, setStreak] = useState(0);
    const [teacherFeedback, setTeacherFeedback] = useState<{ reaction_type: string | null; content: string | null } | null>(null);

    useEffect(() => {
        const storedGroupId = localStorage.getItem('premium_group_id');
        const storedGroupName = localStorage.getItem('premium_group_name');

        if (!storedGroupId) {
            router.push('/premium');
            return;
        }
        setGroupId(storedGroupId);
        if (storedGroupName) setGroupName(storedGroupName);

        const savedName = localStorage.getItem('premium_student_name');
        if (savedName) {
            setStudentName(savedName);
            fetchTodayHomework(storedGroupId, savedName);
            fetchStudentStats(storedGroupId, savedName);
        }
    }, [router]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isFinished) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isFinished]);

    // Fetch Stats & Feedback (Gamification Phase 3)
    const fetchStudentStats = async (gId: string, sName: string) => {
        try {
            // 1. Fetch all homework dates for Streak calculation
            const { data: hwData } = await supabase
                .from('premium_homeworks')
                .select('study_date, id')
                .eq('group_id', gId)
                .eq('student_name', sName)
                .order('study_date', { ascending: false });

            if (hwData && hwData.length > 0) {
                calculateStreak(hwData);

                // 2. Fetch the latest feedback for the most recent homework
                const latestHwId = hwData[0].id; // sorted desc by study_date Date
                const { data: fbData } = await supabase
                    .from('premium_feedback')
                    .select('reaction_type, content')
                    .eq('homework_id', latestHwId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fbData) {
                    setTeacherFeedback({ reaction_type: fbData.reaction_type, content: fbData.content });
                }
            }
        } catch (err) {
            console.error('Error fetching student stats:', err);
        }
    };

    const calculateStreak = (data: { study_date: string }[]) => {
        const uniqueDates = Array.from(new Set(data.map(d => d.study_date))).sort((a, b) => b.localeCompare(a));
        const today = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const todayKstStr = new Date(today.getTime() + kstOffset).toISOString().split('T')[0];
        const yesterdayKstStr = new Date(today.getTime() - 24 * 60 * 60 * 1000 + kstOffset).toISOString().split('T')[0];

        const isTodayDone = uniqueDates.includes(todayKstStr);
        const isYesterdayDone = uniqueDates.includes(yesterdayKstStr);

        let startDateStr = '';
        if (isTodayDone) {
            startDateStr = todayKstStr;
        } else if (isYesterdayDone) {
            startDateStr = yesterdayKstStr;
        } else {
            setStreak(0);
            return;
        }

        let currentStreak = 1;
        let checkDate = parseISO(startDateStr);
        let currentIndex = uniqueDates.indexOf(startDateStr);

        while (currentIndex !== -1 && currentIndex + 1 < uniqueDates.length) {
            const nextDateStr = uniqueDates[currentIndex + 1];
            const expectedNextDate = subDays(checkDate, 1);
            const expectedNextDateStr = format(expectedNextDate, 'yyyy-MM-dd');

            if (nextDateStr === expectedNextDateStr) {
                currentStreak++;
                checkDate = expectedNextDate;
                currentIndex++;
            } else {
                break;
            }
        }
        setStreak(currentStreak);
    };

    const fetchTodayHomework = async (gId: string, sName: string) => {
        const today = new Date();
        const kstDateStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const { data, error } = await supabase
                .from('premium_homeworks')
                .select('*')
                .eq('group_id', gId)
                .eq('student_name', sName)
                .eq('study_date', kstDateStr)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data && !error) {
                setExistingHwId(data.id);
                setDescription(data.description || '');
                setExistingImageUrls(data.image_urls || []);
                setIsDirty(false);
            }
        } catch (err) {
            console.error('Fetch today homework error:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalCurrentFiles = existingImageUrls.length + selectedFiles.length;

            if (totalCurrentFiles + newFiles.length > MAX_IMAGES) {
                toast.error(`사진은 최대 ${MAX_IMAGES}장까지만 올릴 수 있습니다! (현재 ${totalCurrentFiles}장 첨부됨)`);
                const allowedCount = MAX_IMAGES - totalCurrentFiles;
                if (allowedCount > 0) {
                    setSelectedFiles(prev => [...prev, ...newFiles.slice(0, allowedCount)]);
                    setIsDirty(true);
                }
                return;
            }

            setSelectedFiles(prev => [...prev, ...newFiles]);
            setIsDirty(true);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const handleFinish = async () => {
        if (!studentName.trim() || !description.trim()) {
            toast.error('이름과 숙제 설명을 작성해주세요!');
            return;
        }

        if (existingImageUrls.length + selectedFiles.length > MAX_IMAGES) {
            toast.error(`오류: 사진이 ${MAX_IMAGES}장을 초과했습니다.`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const imageUrls: string[] = [...existingImageUrls];
            const totalFiles = selectedFiles.length;
            const processedFiles: File[] = [];

            if (totalFiles > 0) {
                setIsCompressing(true);
                for (let i = 0; i < totalFiles; i++) {
                    const file = selectedFiles[i];
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };

                    try {
                        const compressedFile = await imageCompression(file, options);
                        const finalFile = new File([compressedFile], file.name, { type: file.type });
                        processedFiles.push(finalFile);
                    } catch (cmpError) {
                        console.error('Compression error:', cmpError);
                        processedFiles.push(file);
                    }
                }
                setIsCompressing(false);
            }

            if (processedFiles.length > 0) {
                for (let i = 0; i < processedFiles.length; i++) {
                    const file = processedFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const filePath = `group_${groupId}/${studentName}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage.from('premium-photos').upload(filePath, file);
                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage.from('premium-photos').getPublicUrl(filePath);
                    if (urlData.publicUrl) imageUrls.push(urlData.publicUrl);

                    setUploadProgress(Math.round(((i + 1) / processedFiles.length) * 100));
                }
            }

            const today = new Date();
            const kstDateStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

            const hwData = {
                group_id: groupId,
                student_name: studentName.trim(),
                description: description.trim(),
                image_urls: imageUrls,
                study_date: kstDateStr,
            };

            let dbResult;
            if (existingHwId) {
                dbResult = await supabase.from('premium_homeworks').update(hwData).eq('id', existingHwId);
            } else {
                dbResult = await supabase.from('premium_homeworks').insert([hwData]);
            }

            if (dbResult.error) throw dbResult.error;

            localStorage.setItem('premium_student_name', studentName.trim());
            triggerConfetti();
            triggerSimpleConfetti();
            setIsFinished(true);
            setIsDirty(false);
            setSelectedFiles([]);
            setStreak(prev => isFinished ? prev : prev + 1); // Optimistic streak update

        } catch (error) {
            console.error('Homework upload error:', error);
            toast.error('숙제 등록 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingHwId) return;
        if (!confirm('정말 오늘 제출한 숙제를 삭제할까요?')) return;

        setUploading(true);
        try {
            const { error } = await supabase.from('premium_homeworks').delete().eq('id', existingHwId);
            if (error) throw error;

            toast.success('삭제되었습니다.');
            setExistingHwId(null);
            setDescription('');
            setExistingImageUrls([]);
            setSelectedFiles([]);
            setIsDirty(false);
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('삭제 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    if (isFinished) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white transition-all">
                <div className="text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-md border-2 border-green-100 animate-bounce">
                            🚀
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900">제출 완료! 🎉</h1>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">선생님께 숙제가 전송되었어요. 멋져요!</p>
                    <button
                        onClick={() => {
                            setIsFinished(false);
                            setUploadProgress(0);
                            fetchTodayHomework(groupId, studentName);
                        }}
                        className="mt-8 px-6 py-4 bg-toss-blue text-white font-extrabold rounded-2xl hover:bg-blue-600 transition-colors shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        {existingHwId ? '내용 다시 보기' : '숙제 창으로 돌아가기'}
                    </button>
                </div>
            </main>
        );
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setStudentName(val);
        setIsDirty(true);
    };

    const handleNavigationClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (isDirty && !isFinished) {
            e.preventDefault();
            if (confirm('저장하지 않은 내용이 있습니다. 정말 나가시겠어요? 😱')) {
                router.push(href);
            }
        }
    };

    const maxEXP = 10;
    const currentEXP = streak % maxEXP;
    const expPercentage = Math.min((currentEXP / maxEXP) * 100, 100);

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 pb-32">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between pt-4">
                    <a href="/group" onClick={(e) => handleNavigationClick(e, "/group")} className="text-gray-500 hover:text-gray-900 font-medium cursor-pointer flex items-center gap-1">
                        <span className="text-lg">&larr;</span> 뒤로
                    </a>
                    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                        {groupName} 단체방
                    </div>
                </div>

                {/* Gamification Area: Feedback box & EXP Bar */}
                {studentName && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* EXP Bar (Streak Tracker) */}
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-orange-100 flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                    🔥 연속 <span className="text-orange-500 text-lg">{streak}</span>일째
                                </span>
                                <span className="text-xs font-bold text-gray-400">LV.{Math.floor(streak / maxEXP) + 1}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-1000 ease-out rounded-full"
                                    style={{ width: `${expPercentage}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-center font-bold text-gray-400 mt-1">다음 레벨까지 {maxEXP - currentEXP}일 남았어요!</p>
                        </div>

                        {/* Teacher's Feedback Inbox */}
                        {teacherFeedback && (
                            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex items-start gap-4">
                                <div className="text-4xl shrink-0 drop-shadow-sm self-center">
                                    {teacherFeedback.reaction_type || '💌'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-blue-900 mb-1">선생님의 최신 답장함</h3>
                                    <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                        {teacherFeedback.content ? `"${teacherFeedback.content}"` : '선생님이 확인했어요!'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* Homework Upload Form */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            {existingHwId ? '숙제 수정하기 ✏️' : '숙제 올리기 📝'}
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium text-sm">
                            {existingHwId ? '오늘 제출한 숙제를 수정할 수 있어요.' : '오늘 한 숙제를 자랑해 볼까요?'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">내 이름 👤</label>
                        <input
                            type="text"
                            value={studentName}
                            onChange={handleNameChange}
                            onBlur={() => studentName && fetchStudentStats(groupId, studentName)}
                            placeholder="이름을 알려주세요"
                            disabled={!!existingHwId}
                            className={`w-full px-5 py-4 rounded-2xl border border-gray-200 outline-none transition-all font-medium ${!!existingHwId ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-white focus:bg-white focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">숙제 설명 ✍️</label>
                        <textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                            placeholder="수학 10방울, 영어 단어 50개 외우기 등 자세히 적어주세요!"
                            rows={4}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all resize-none font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">
                            숙제 사진 📸 {existingHwId ? `(추가 가능, 최대 ${MAX_IMAGES}장)` : `(최대 ${MAX_IMAGES}장)`}
                        </label>

                        <div className="flex flex-wrap gap-3 mb-3">
                            {/* Existing Images */}
                            {existingImageUrls.map((url, i) => (
                                <div key={`existing-${i}`} className="relative group">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border border-green-200 shadow-sm">
                                        <img src={url} alt="existing" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                                            <span className="bg-white/95 text-[10px] font-bold px-1.5 py-0.5 rounded text-green-700 shadow-sm border border-green-100">제출됨</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setExistingImageUrls(prev => prev.filter((_, idx) => idx !== i));
                                            setIsDirty(true);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {/* New Selections */}
                            {selectedFiles.map((file, i) => (
                                <div key={`new-${i}`} className="relative group">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border-2 border-toss-blue/50 shadow-sm">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {existingImageUrls.length + selectedFiles.length < MAX_IMAGES && (
                                <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 transition-colors text-gray-400 bg-gray-50">
                                    <span className="text-3xl">+</span>
                                    <input type="file" accept="image/*, .heic, .heif, .webp" multiple onChange={handleFileChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {existingHwId && (
                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                onClick={handleDelete}
                                disabled={uploading}
                                className="text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                            >
                                오늘 제출 데이터 삭제 🗑️
                            </button>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30 pb-safe">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleFinish}
                            disabled={uploading || !studentName.trim() || !description.trim()}
                            className={`
                                w-full py-4 rounded-2xl text-lg font-extrabold shadow-lg transition-all flex flex-col items-center justify-center relative overflow-hidden
                                ${uploading || !studentName.trim() || !description.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                                    : 'bg-toss-blue hover:bg-blue-600 text-white shadow-blue-500/20 active:scale-[0.98]'
                                }
                            `}
                        >
                            {uploading && (
                                <div
                                    className="absolute inset-0 bg-blue-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%`, opacity: 0.2 }}
                                />
                            )}
                            {uploading ? (
                                <div className="flex flex-col items-center z-10 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm md:text-base whitespace-nowrap">
                                            {isCompressing
                                                ? "사진 최적화 중... ⏳"
                                                : `로켓 쏘는 중! 🚀 (${uploadProgress}%)`}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="z-10">{existingHwId ? '수정 완료하기 ✨' : '로켓 발사! (숙제 제출) 🚀'}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { triggerConfetti, triggerSimpleConfetti } from '@/lib/confetti';
import imageCompression from 'browser-image-compression';
import { format, subDays, parseISO } from 'date-fns';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!studentName.trim()) {
            toast.error('이름을 선택하거나 입력해주세요!');
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
                    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp" as string };

                    try {
                        const compressedFile = await imageCompression(file, options);
                        const finalFile = new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp" });
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
                    const fileExt = file.name.split('.').pop() || "webp";
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
            <PageTransition>
                <main className="flex min-h-screen flex-col items-center bg-gray-50 pb-32">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-10 mt-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
                        >
                            {/* Celebration Animation */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: [0, -20, 0], opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="text-8xl mb-4"
                            >
                                🚀
                            </motion.div>

                            <div className="space-y-3 z-10 relative">
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl font-black text-gray-900"
                                >
                                    제출 완료! 🎉
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-gray-500 font-medium leading-relaxed"
                                >
                                    선생님이 올리신 사진을 확인하실 거예요.<br />조금만 기다려주세요!
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="w-full pt-4"
                            >
                                <button
                                    onClick={() => {
                                        setIsFinished(false);
                                        setUploadProgress(0);
                                        fetchTodayHomework(groupId, studentName);
                                    }}
                                    className="w-full px-6 py-4 bg-toss-blue text-white font-extrabold rounded-2xl hover:bg-toss-blue-hover transition-colors shadow-xl shadow-blue-500/20 active:scale-95"
                                >
                                    {existingHwId ? '내용 다시 보기' : '숙제 창으로 돌아가기'}
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </PageTransition>
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
        <PageTransition>
            <main className="flex min-h-screen flex-col items-center bg-gray-50 pb-32">
                <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl px-6 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between pt-10 mb-6">
                        <a href="/group" onClick={(e) => handleNavigationClick(e, "/group")} className="text-gray-500 hover:text-gray-900 font-medium cursor-pointer flex items-center gap-1 transition-all hover:-translate-x-1">
                            <span className="text-xl">&larr;</span> 뒤로
                        </a>
                        <div className="bg-white text-gray-600 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm border border-gray-100">
                            {groupName} 단체방
                        </div>
                    </div>

                    {/* Gamification Area: Feedback box & EXP Bar */}
                    {studentName && (
                        <div className="w-full space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* EXP Bar (Streak Tracker) */}
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-orange-100 flex flex-col gap-2 relative overflow-hidden">
                                <div className="flex justify-between items-end relative z-10">
                                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                        <span className="text-lg">🔥</span> 단기 집중 연속 <span className="text-orange-500 text-lg mx-0.5">{streak}</span>일째
                                    </span>
                                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md text-xs font-bold">LV.{Math.floor(streak / maxEXP) + 1}</span>
                                </div>
                                <div className="w-full h-3 bg-orange-50 rounded-full overflow-hidden relative mt-1">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${expPercentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center font-bold text-orange-400 mt-1 relative z-10">다음 레벨업 보상까지 {maxEXP - currentEXP}일 남았어요!</p>
                            </div>

                            {/* Teacher's Feedback Inbox */}
                            {teacherFeedback ? (
                                <div className="bg-blue-50/80 p-5 rounded-3xl border border-blue-100 flex items-start gap-4 shadow-sm group hover:bg-blue-50 transition-colors">
                                    <div className="text-4xl shrink-0 drop-shadow-sm self-center group-hover:scale-110 transition-transform">
                                        {teacherFeedback.reaction_type || '💌'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-toss-blue mb-1">선생님의 최근 답장</h3>
                                        <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                                            {teacherFeedback.content ? `"${teacherFeedback.content}"` : '선생님이 확인했어요!'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-200 p-5 rounded-3xl flex items-center gap-4 grayscale opacity-60">
                                    <div className="text-3xl shrink-0 drop-shadow-sm self-center">📮</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-500">아직 선생님의 답장이 없어요</p>
                                        <p className="text-xs font-semibold text-gray-400">숙제를 제출하고 기다려볼까요?</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Homework Upload Form */}
                    <div className="w-full bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6 relative overflow-hidden">
                        <div className="mb-2">
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                {existingHwId ? '숙제 수정하기 ✏️' : '오늘의 공부 인증 🎉'}
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium text-sm">
                                {existingHwId ? '오늘 제출한 숙제를 수정할 수 있어요.' : '오늘 공부한 내용을 쿨하게 남겨보세요!'}
                            </p>
                        </div>

                        {/* 1. Name Input (Floating Label) */}
                        <div className="input-group">
                            <input
                                id="studentName"
                                type="text"
                                value={studentName}
                                onChange={handleNameChange}
                                onBlur={() => studentName && fetchStudentStats(groupId, studentName)}
                                placeholder="내 이름 👤"
                                disabled={!!existingHwId}
                            />
                            <label htmlFor="studentName">내 이름 👤</label>
                        </div>

                        {/* 2. Description (Floating Label) */}
                        <div className="input-group">
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                                placeholder="무엇을 공부했나요? (예: 수학 개념 30p) ✍️"
                                rows={4}
                                className="resize-none"
                            />
                            <label htmlFor="description">오늘의 공부 내용 ✍️ <span className="text-gray-400 font-medium">(선택)</span></label>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end mb-1 ml-1">
                                <label className="text-sm font-bold text-gray-700">
                                    인증 사진 📸 <span className="text-gray-400 font-medium">(선택)</span> {existingHwId && <span className="text-toss-blue font-semibold">(추가 가능)</span>}
                                </label>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                                    {existingImageUrls.length + selectedFiles.length} / {MAX_IMAGES}장
                                </span>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {/* Existing Images */}
                                {existingImageUrls.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="기존 첨부사진" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <button
                                            onClick={() => {
                                                setExistingImageUrls(prev => prev.filter((_, idx) => idx !== i));
                                                setIsDirty(true);
                                            }}
                                            className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 active:scale-95"
                                            type="button"
                                            aria-label="기존 이미지 삭제"
                                        >
                                            ✕
                                        </button>
                                        <div className="absolute bottom-1.5 left-1.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                            제출됨
                                        </div>
                                    </div>
                                ))}

                                {/* New Selections */}
                                {selectedFiles.map((file, i) => (
                                    <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-toss-blue/30">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={URL.createObjectURL(file)} alt="새 첨부사진" className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-toss-blue/10" />
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 active:scale-95"
                                            type="button"
                                            aria-label="안올릴래"
                                        >
                                            ✕
                                        </button>
                                        <div className="absolute bottom-1.5 left-1.5 bg-toss-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                            새로 추가
                                        </div>
                                    </div>
                                ))}

                                {/* Upload Trigger Button */}
                                {existingImageUrls.length + selectedFiles.length < MAX_IMAGES && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:text-blue-500 transition-all text-gray-400 bg-gray-50 active:scale-[0.98] gap-1">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        <span className="text-xs font-bold font-sans">추가</span>
                                        <input type="file" accept="image/*, .heic, .heif, .webp" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Upload Progress */}
                        {uploading && uploadProgress > 0 && (
                            <div className="w-full space-y-2 animate-in fade-in">
                                <div className="flex justify-between text-xs font-bold text-toss-blue">
                                    <span>업로드 우주선 발사 중... 🚀</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-toss-blue h-3 rounded-full transition-all duration-300 animate-pulse"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {existingHwId && (
                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleDelete}
                                    disabled={uploading}
                                    className="text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    오늘 제출 데이터 초기화 🗑️
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30 pb-safe">
                        <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                            <button
                                onClick={handleFinish}
                                disabled={uploading || !studentName.trim()}
                                className={`
                                    w-full py-4 rounded-2xl text-lg font-extrabold shadow-lg transition-all flex flex-col items-center justify-center relative overflow-hidden h-[60px]
                                    ${uploading || !studentName.trim()
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                                        : 'bg-toss-blue hover:bg-toss-blue-hover text-white shadow-blue-500/20 active:scale-[0.98]'
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
                                    <div className="flex flex-col items-center z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-base whitespace-nowrap">
                                                {isCompressing
                                                    ? "사진 최적화 중... ⏳"
                                                    : `로켓 쏘는 중! 🚀`}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="z-10">{existingHwId ? '수정 완료하기 ✨' : '완료하고 발사! 🚀'}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}

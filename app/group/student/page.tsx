'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { triggerConfetti, triggerSimpleConfetti } from '@/lib/confetti';
import imageCompression from 'browser-image-compression';

const MAX_IMAGES = 10; // 대빵 지시: 사진 10장 넘어가면 컷!

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

    // For editing/deleting existing homework
    const [existingHwId, setExistingHwId] = useState<string | null>(null);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

    // 대빵 지시: 저장 안 하고 나가는 것 방지 (isDirty 플래그)
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const storedGroupId = localStorage.getItem('premium_group_id');
        const storedGroupName = localStorage.getItem('premium_group_name');

        if (!storedGroupId) {
            router.push('/premium');
            return;
        }
        setGroupId(storedGroupId);
        if (storedGroupName) setGroupName(storedGroupName);

        // Load saved student name if any
        const savedName = localStorage.getItem('premium_student_name');
        if (savedName) {
            setStudentName(savedName);
            fetchTodayHomework(storedGroupId, savedName);
        }
    }, [router]);

    // 대빵 지시: 창 닫거나 새로고침할 때 경고 띄우기
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isFinished) {
                e.preventDefault();
                e.returnValue = ''; // Chrome require this to show the prompt
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isFinished]);

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
                setIsDirty(false); // 초기 로드 시점엔 안 더러움
            }
        } catch (err) {
            console.error('Fetch today homework error:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalCurrentFiles = existingImageUrls.length + selectedFiles.length;

            // 대빵 지시: 여기서 10장 넘는지 체크!
            if (totalCurrentFiles + newFiles.length > MAX_IMAGES) {
                alert(`사진은 최대 ${MAX_IMAGES}장까지만 올릴 수 있습니다! (현재 ${totalCurrentFiles}장 첨부됨)`);
                // 가능한 만큼만 자르기
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
            alert('이름과 숙제 설명을 작성해주세요!');
            return;
        }

        // 대빵 지시: 서버로 보내기 직전에도 방어 로직 한 번 더!
        if (existingImageUrls.length + selectedFiles.length > MAX_IMAGES) {
            alert(`오류: 사진이 ${MAX_IMAGES}장을 초과했습니다.`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // 1. Compress multiple photos
            const imageUrls: string[] = [...existingImageUrls];
            const totalFiles = selectedFiles.length;
            const processedFiles: File[] = [];

            if (totalFiles > 0) {
                setIsCompressing(true);
                for (let i = 0; i < totalFiles; i++) {
                    const file = selectedFiles[i];
                    // Skip compression if file is already small (e.g. < 1MB)
                    // But library handles it gracefully with options.
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    };

                    try {
                        const compressedFile = await imageCompression(file, options);
                        // Convert Blob back to File to keep metadata if possible
                        const finalFile = new File([compressedFile], file.name, { type: file.type });
                        processedFiles.push(finalFile);
                    } catch (cmpError) {
                        console.error('Compression error, using original:', cmpError);
                        processedFiles.push(file);
                    }
                }
                setIsCompressing(false);
            }

            // 2. Upload multiple photos
            if (processedFiles.length > 0) {
                for (let i = 0; i < processedFiles.length; i++) {
                    const file = processedFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const filePath = `group_${groupId}/${studentName}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('premium-photos')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('premium-photos')
                        .getPublicUrl(filePath);

                    if (urlData.publicUrl) {
                        imageUrls.push(urlData.publicUrl);
                    }

                    setUploadProgress(Math.round(((i + 1) / processedFiles.length) * 100));
                }
            }

            // 2. Upsert into premium_homeworks table
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
                dbResult = await supabase
                    .from('premium_homeworks')
                    .update(hwData)
                    .eq('id', existingHwId);
            } else {
                dbResult = await supabase
                    .from('premium_homeworks')
                    .insert([hwData]);
            }

            if (dbResult.error) throw dbResult.error;

            localStorage.setItem('premium_student_name', studentName.trim());
            triggerConfetti();
            triggerSimpleConfetti();
            setIsFinished(true);
            setIsDirty(false); // 저장 완료되면 맘 편히 나가도 됨!
            setSelectedFiles([]);

        } catch (error) {
            console.error('Homework upload error:', error);
            alert('숙제 등록 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingHwId) return;
        if (!confirm('정말 오늘 제출한 숙제를 삭제할까요?')) return;

        setUploading(true);
        try {
            const { error } = await supabase
                .from('premium_homeworks')
                .delete()
                .eq('id', existingHwId);

            if (error) throw error;

            alert('삭제되었습니다.');
            setExistingHwId(null);
            setDescription('');
            setExistingImageUrls([]);
            setSelectedFiles([]);
            setIsDirty(false); // 지운 직후에는 나갈 수 있음
        } catch (error) {
            console.error('Delete error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    if (isFinished) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white transition-all">
                <div className="absolute top-6 left-6">
                    <Link href="/group/role-select" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; 역할 선택으로
                    </Link>
                </div>
                <div className="text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-green-100">
                            ✓
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">숙제 제출 완료! 🎉</h1>
                    </div>
                    <p className="text-gray-500 text-lg">선생님께 숙제가 전달되었어요. 수고했어요!</p>
                    <button
                        onClick={() => {
                            setIsFinished(false);
                            setUploadProgress(0);
                            fetchTodayHomework(groupId, studentName);
                        }}
                        className="mt-8 px-6 py-3 bg-toss-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {existingHwId ? '내용 다시 보기' : '새로운 숙제 더 올리기'}
                    </button>
                </div>
            </main>
        );
    }

    // 뒤로가기 링크 클릭 시 경고 처리를 위한 래퍼 함수 (Next.js Link는 beforeunload를 안 거침)
    const handleNavigationClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (isDirty && !isFinished) {
            e.preventDefault();
            if (confirm('저장하지 않은 내용이 있습니다. 정말 나가시겠어요? 😱')) {
                router.push(href);
            }
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 pb-32">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between pt-4">
                    <a href="/group/role-select" onClick={(e) => handleNavigationClick(e, "/group/role-select")} className="text-gray-500 hover:text-gray-900 font-medium cursor-pointer">
                        &larr; 뒤로
                    </a>
                    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-bold">
                        {groupName} 단체방
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {existingHwId ? '숙제 수정하기 ✏️' : '숙제 제출하기 📝'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {existingHwId ? '오늘 제출한 숙제를 수정할 수 있어요.' : '오늘 한 숙제를 자랑해 볼까요?'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">내 이름</label>
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => { setStudentName(e.target.value); setIsDirty(true); }}
                            placeholder="이름을 알려주세요"
                            disabled={!!existingHwId}
                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all ${!!existingHwId ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:border-toss-blue focus:ring-2 focus:ring-blue-100'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">오늘 어떤 숙제를 했나요?</label>
                        <textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                            placeholder="수학 10페이지, 영어 단어 50개 외우기 등 자세히 적어주세요!"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">
                            숙제 사진 {existingHwId ? `(추가 가능, 최대 ${MAX_IMAGES}장)` : `(최대 ${MAX_IMAGES}장)`}
                        </label>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {/* Existing Images */}
                            {existingImageUrls.map((url, i) => (
                                <div key={`existing-${i}`} className="relative group">
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden border-2 border-green-200">
                                        <img src={url} alt="existing" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                                            <span className="bg-white/90 text-[10px] font-bold px-1 rounded text-green-600 shadow-sm">제출됨</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setExistingImageUrls(prev => prev.filter((_, idx) => idx !== i));
                                            setIsDirty(true);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {/* New Selections */}
                            {selectedFiles.map((file, i) => (
                                <div key={`new-${i}`} className="relative group">
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden border border-toss-blue">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-70" />
                                    </div>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {existingImageUrls.length + selectedFiles.length < MAX_IMAGES && (
                                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                                    <span className="text-2xl text-gray-400">+</span>
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
                                className="text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                            >
                                오늘 제출 데이터 삭제
                            </button>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleFinish}
                            disabled={uploading || !studentName.trim() || !description.trim()}
                            className={`
                                w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex flex-col items-center justify-center relative overflow-hidden
                                ${uploading || !studentName.trim() || !description.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-toss-blue hover:bg-blue-600 text-white shadow-blue-500/30 active:scale-95'
                                }
                            `}
                        >
                            {uploading && (
                                <div
                                    className="absolute inset-0 bg-blue-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%`, opacity: 0.1 }}
                                />
                            )}
                            {uploading ? (
                                <div className="flex flex-col items-center z-10 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm md:text-base whitespace-nowrap">
                                            {isCompressing
                                                ? "사진을 압축하고 올리는 중입니다... ⏳"
                                                : `사진 전송 중... (${uploadProgress}%)`}
                                        </span>
                                    </div>
                                    {!isCompressing && (
                                        <div className="w-48 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="z-10">{existingHwId ? '숙제 수정 완료하기 ✨' : '오늘 숙제 제출하기 🚀'}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

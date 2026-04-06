'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, ImageIcon, LoaderCircle, X } from 'lucide-react';
import type { NoticeItem } from '@/lib/supabase-notices';

type NoticesResponse = {
  notices: NoticeItem[];
};

export default function AdminNoticesManager({ initialNotices }: { initialNotices: NoticeItem[] }) {
  const [notices, setNotices] = useState(initialNotices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [category, setCategory] = useState('운영');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const resetForm = () => {
    setEditingNoticeId(null);
    setCategory('운영');
    setTitle('');
    setAuthor('');
    setDate(new Date().toISOString().slice(0, 10));
    setContent('');
    setImagesText('');
  };

  const openCreateModal = () => {
    setError(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (notice: NoticeItem) => {
    setError(null);
    setEditingNoticeId(notice.id);
    setCategory(notice.category);
    setTitle(notice.title);
    setAuthor(notice.author);
    setDate(notice.date);
    setContent(notice.content);
    setImagesText(notice.images.join('\n'));
    setIsModalOpen(true);
  };

  const parseImages = () =>
    imagesText
      .split('\n')
      .map((image) => image.trim())
      .filter(Boolean);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notices', {
        method: editingNoticeId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNoticeId,
          category,
          title,
          author,
          date,
          content,
          images: parseImages(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        notice?: NoticeItem;
      };

      if (!response.ok || !payload.notice) {
        throw new Error(payload.error ?? (editingNoticeId ? '공지 수정에 실패했습니다.' : '공지 생성에 실패했습니다.'));
      }

      setNotices((current) =>
        editingNoticeId
          ? current.map((notice) => (notice.id === payload.notice!.id ? payload.notice! : notice))
          : [payload.notice!, ...current],
      );
      setIsModalOpen(false);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '공지 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noticeId: number) => {
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(noticeId);
    setError(null);

    try {
      const response = await fetch(`/api/notices?id=${noticeId}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? '공지 삭제에 실패했습니다.');
      }

      setNotices((current) => current.filter((notice) => notice.id !== noticeId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '공지 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">등록된 공지</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="interactive-soft inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow text-monolith-primaryContainer shadow-[0_14px_34px_rgba(0,51,97,0.08)] transition hover:border-monolith-primaryContainer/40 hover:text-monolith-primary"
            aria-label="새 공지 추가"
            title="새 공지 추가"
          >
            <i className="fa-solid fa-plus text-[16px]" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">{notice.category}</p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-monolith-onSurface">{notice.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-monolith-onSurfaceMuted">
                    <span>작성자 {notice.author}</span>
                    <span>이미지 {notice.images.length}개</span>
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-monolith-surfaceLowest px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(notice)}
                      className="interactive-soft inline-flex h-9 w-9 items-center justify-center rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surface text-monolith-onSurfaceMuted transition hover:border-monolith-primaryContainer/30 hover:bg-monolith-surfaceLow hover:text-monolith-primary"
                      aria-label={`${notice.title} 수정`}
                      title="수정"
                    >
                      <i className="fa-regular fa-pen-to-square text-[13px]" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(notice.id)}
                      disabled={deletingId === notice.id}
                      className="interactive-soft inline-flex h-9 w-9 items-center justify-center rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surface text-monolith-onSurfaceMuted transition hover:border-monolith-error/30 hover:bg-monolith-errorContainer hover:text-monolith-error disabled:opacity-60"
                      aria-label={`${notice.title} 삭제`}
                      title="삭제"
                    >
                      {deletingId === notice.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <i className="fa-solid fa-trash text-[12px]" aria-hidden="true" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2 text-xs font-semibold text-monolith-onSurfaceMuted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{notice.date}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {notices.length === 0 ? (
            <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5 text-sm text-monolith-onSurfaceMuted">
              등록된 공지가 없습니다.
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-monolith-errorContainer px-4 py-4 text-sm text-monolith-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(73,139,196,0.22),transparent_42%),linear-gradient(180deg,rgba(0,23,45,0.68),rgba(0,23,45,0.5))] px-4 py-8 backdrop-blur-[6px]">
          <div className="absolute inset-0 bg-monolith-grid opacity-[0.08]" aria-hidden="true" />
          <div className="flex min-h-full items-center justify-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-notice-modal-title"
              className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,247,252,0.94))] p-6 shadow-[0_28px_90px_rgba(0,24,46,0.28)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(120,180,227,0.28),transparent_70%)]" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">{editingNoticeId ? '공지 수정' : '새 공지 추가'}</p>
                  <h2 id="create-notice-modal-title" className="mt-2 text-2xl font-black tracking-tight text-monolith-onSurface">
                    {editingNoticeId ? '공지 내용을 수정하세요' : '새 공지를 작성하세요'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest text-monolith-onSurfaceMuted transition hover:border-monolith-outlineVariant/40 hover:text-monolith-onSurface"
                  aria-label="닫기"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">카테고리</span>
                    <input
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                      placeholder="운영"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">작성자</span>
                    <input
                      value={author}
                      onChange={(event) => setAuthor(event.target.value)}
                      className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                      placeholder="작성자"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                    placeholder="공지 제목"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">게시일</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">본문</span>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="min-h-40 w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                    placeholder="공지 본문"
                    required
                  />
                  <p className="mt-2 text-xs text-monolith-onSurfaceMuted">마크다운 문법을 지원합니다. 예: 제목(`#`), 목록(`-`), 링크, 표, 코드 블록.</p>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-monolith-onSurface">
                    <ImageIcon className="h-4 w-4" />
                    이미지 URL 목록
                  </span>
                  <textarea
                    value={imagesText}
                    onChange={(event) => setImagesText(event.target.value)}
                    className="min-h-28 w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                    placeholder={'https://s3.example.com/image-1.png\nhttps://s3.example.com/image-2.png'}
                  />
                  <p className="mt-2 text-xs text-monolith-onSurfaceMuted">한 줄에 S3 이미지 링크 하나씩 입력합니다.</p>
                </label>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="interactive-soft rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-5 py-3 text-sm font-semibold text-monolith-onSurface transition hover:border-monolith-outlineVariant/50"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="interactive-soft flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0e4a84,#003361)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(0,51,97,0.18)] transition-all hover:brightness-105 disabled:opacity-60"
                  >
                    {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingNoticeId ? <i className="fa-regular fa-pen-to-square text-[14px]" aria-hidden="true" /> : <i className="fa-solid fa-plus text-[14px]" aria-hidden="true" />}
                    {editingNoticeId ? '공지 수정' : '공지 추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MessageSquare, Star } from 'lucide-react';
import { useLanguage } from './Language';
import { maskedReviewName, reviewLimits, type OwnCommunityReview, type CommunityReviews } from '../utils/communityReviews';

const stars = [1, 2, 3, 4, 5];
const fields = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600';
const primary = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';
const emptyForm = { maskName: true, comment: '', rating: 0 };

function reviewForm(review: OwnCommunityReview | null) {
  return review ? { maskName: review.maskName ?? true, comment: review.comment, rating: review.rating } : emptyForm;
}

export default function CommunityStories({ onOpenProfile }: { onOpenProfile?: () => void }) {
  const { locale, t } = useLanguage();
  const canReview = Boolean(onOpenProfile);
  const [reviews, setReviews] = useState<CommunityReviews | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [visible, setVisible] = useState(3);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<'saved' | 'removed' | ''>('');
  const [error, setError] = useState('');
  const date = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
  const authorName = reviews?.authorName;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/community-reviews', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const result: CommunityReviews = await response.json();
        if (controller.signal.aborted) return;
        setReviews(result);
        setForm(reviewForm(result.own));
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); });
    return () => controller.abort();
  }, [canReview, attempt]);

  async function changeReview(method: 'PUT' | 'DELETE') {
    if (!canReview || pending) return;
    setError('');
    setNotice('');
    const removing = method === 'DELETE';
    if (removing && !window.confirm(t('Hapus ulasanmu dari beranda?', 'Remove your review from the homepage?'))) return;
    setPending(true);
    try {
      const response = await fetch('/api/community-reviews', removing ? { method } : {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maskName: form.maskName, comment: form.comment, rating: form.rating }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? 'session' : response.status === 400 ? 'invalid' :
          response.status === 422 ? 'profile' : 'request');
        return;
      }
      const saved: OwnCommunityReview | null = removing ? null : await response.json();
      setReviews(previous => {
        const remaining = (previous?.items ?? []).filter(review => review.id !== previous?.own?.id && review.id !== saved?.id);
        return { authorName: previous?.authorName ?? null, own: saved,
          items: saved ? [saved, ...remaining].slice(0, reviewLimits.latest) : remaining };
      });
      setForm(reviewForm(saved));
      setNotice(removing ? 'removed' : 'saved');
    } catch {
      setError('request');
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void changeReview('PUT');
  }

  return (
    <section aria-labelledby="community-stories-title" className="bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 id="community-stories-title" className="text-3xl font-bold text-gray-900 md:text-4xl">
            {t('Cerita dari komunitas', 'Community stories')}
          </h2>
          <p className="mt-3 text-gray-600">{t('Baca pengalaman pengguna dan bagikan ceritamu di Lestari.', 'Read what others have shared and tell us about your experience with Lestari.')}</p>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">{t('Ulasan terbaru', 'Latest reviews')}</h3>
            {loadError ? <div className="rounded-2xl border border-indigo-100 bg-white p-4">
              <p role="alert" className="text-sm text-gray-700">{t('Ulasan belum bisa dimuat.', 'Could not load the reviews.')}</p>
              <button type="button" className="mt-2 min-h-10 font-semibold text-indigo-700 hover:underline"
                onClick={() => { setLoadError(false); setAttempt(previous => previous + 1); }}>
                {t('Coba lagi', 'Try again')}
              </button>
            </div> : !reviews ? (
              <p role="status" className="text-sm text-gray-600">{t('Memuat ulasan…', 'Loading reviews…')}</p>
            ) : reviews.items.length === 0 ? (
              <p className="rounded-2xl border border-indigo-100 bg-white p-5 text-sm text-gray-700">
                {t('Belum ada ulasan. Kamu bisa jadi yang pertama berbagi.', 'No reviews yet. Be the first to share your experience.')}
              </p>
            ) : (
              <ul className="space-y-3">
                {reviews.items.slice(0, visible).map(review => (
                  <li key={review.id} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-gray-900">{review.displayName}</p>
                        <time dateTime={review.updatedAt} className="text-xs text-gray-600">{date.format(new Date(review.updatedAt))}</time>
                      </div>
                      <div className="flex shrink-0 gap-0.5" aria-label={t(`${review.rating} dari 5 bintang`, `${review.rating} out of 5 stars`)} role="img">
                        {stars.map(star => <Star key={star} aria-hidden="true" className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-600' : 'text-gray-400'}`} />)}
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
            {reviews && visible < reviews.items.length && <button type="button" onClick={() => setVisible(previous => previous + 3)}
              className="min-h-11 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              {t('Lihat ulasan lainnya', 'See more reviews')}
            </button>}
          </div>
          <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <MessageSquare aria-hidden="true" className="h-5 w-5 text-indigo-700" />
              {reviews?.own ? t('Ulasanmu', 'Your review') : t('Tulis ulasan', 'Write a review')}
            </h3>
            {!canReview ? <>
              <p className="mb-4 mt-2 text-sm text-gray-600">{t('Masuk sebagai pencari kerja untuk berbagi pengalamanmu.', 'Sign in as a job seeker to share your experience.')}</p>
              <Link href="/masuk" className={primary}>{t('Masuk untuk menulis', 'Sign in to write')}</Link>
            </> : reviews && (
              <form onSubmit={submit} className="mt-3">
                <fieldset disabled={pending} className="grid gap-3">
                  {authorName ? <div className="grid gap-2 rounded-xl border border-indigo-100 p-3">
                    <p className="text-sm text-gray-600">{t('Nama ulasan diambil dari profil Lestari.', 'Your review uses the name from your Lestari profile.')}</p>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <input type="checkbox" checked={form.maskName}
                        onChange={event => setForm({ ...form, maskName: event.target.checked })}
                        className="h-4 w-4 shrink-0 accent-indigo-700" />
                      {t('Samarkan nama profil', 'Mask my profile name')}
                    </label>
                    <p className="break-words text-sm text-gray-600" aria-live="polite">
                      {t('Nama yang tampil di beranda', 'Name shown on the homepage')}{' '}
                      <strong className="block text-gray-900">{form.maskName ? maskedReviewName(authorName) : authorName}</strong>
                    </p>
                  </div> : <div className="rounded-xl border border-indigo-100 p-3 text-sm text-gray-700">
                    <p>{t('Isi nama di profil untuk menerbitkan ulasan.', 'Add your name to your profile to publish a review.')}</p>
                    <button type="button" onClick={onOpenProfile} className="mt-1 min-h-10 font-semibold text-indigo-700 hover:underline">
                      {t('Buka profil', 'Open profile')}
                    </button>
                  </div>}
                  <fieldset>
                    <legend className="mb-1 text-sm font-medium text-gray-900">{t('Rating', 'Rating')}</legend>
                    <div className="flex flex-wrap gap-1">
                      {stars.map(star => <label key={star} className="cursor-pointer">
                        <input type="radio" name="review-rating" required value={star} checked={form.rating === star}
                          onChange={() => setForm({ ...form, rating: star })}
                          aria-label={t(`${star} bintang`, `${star} stars`)} className="peer sr-only" />
                        <span className="grid h-10 w-10 place-items-center rounded-lg hover:bg-indigo-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-600">
                          <Star aria-hidden="true" className={`h-6 w-6 ${star <= form.rating ? 'fill-yellow-400 text-yellow-600' : 'text-gray-400'}`} />
                        </span>
                      </label>)}
                    </div>
                  </fieldset>
                  <label className="grid gap-1 text-sm font-medium text-gray-900">
                    {t('Komentar', 'Comment')}
                    <textarea className={fields} required rows={4} maxLength={reviewLimits.comment} value={form.comment}
                      onChange={event => setForm({ ...form, comment: event.target.value })} />
                  </label>
                  <p className="text-right text-xs text-gray-600">{form.comment.length}/{reviewLimits.comment}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={!authorName} className={primary}>
                      {reviews.own ? t('Simpan perubahan', 'Save changes') : t('Terbitkan ulasan', 'Publish review')}
                    </button>
                    {reviews.own && <button type="button" onClick={() => void changeReview('DELETE')}
                      className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
                      {t('Hapus ulasan', 'Delete review')}
                    </button>}
                  </div>
                </fieldset>
                {error && <p role="alert" className="mt-3 text-sm text-red-700">
                  {error === 'session' ? t('Silakan masuk kembali.', 'Please sign in again.') :
                    error === 'invalid' ? t('Periksa komentar dan rating.', 'Check your comment and rating.') :
                    error === 'profile' ? t('Isi nama di profil sebelum menyimpan ulasan.', 'Add your name to your profile before saving the review.') :
                    t('Ulasan gagal diperbarui. Coba lagi.', 'Could not update your review. Try again.')}
                </p>}
                <p role="status" className="mt-3 text-sm text-gray-700">
                  {pending ? t('Sedang memproses…', 'Working…') :
                    notice === 'saved' ? t('Ulasanmu sudah terbit.', 'Your review is published.') :
                    notice === 'removed' ? t('Ulasanmu sudah dihapus.', 'Your review was removed.') : ''}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BdsHoneypotField } from '@/components/bds-shared/BdsHoneypotField';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { useBdsAntiSpam } from '@/lib/bds-anti-spam';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { contactSchema, type ContactInput } from '@/lib/bds-schemas';
import type { BdsPaginated, BdsProperty, BdsWrapped } from '@/types/bds';

/** Chỉ giữ lại chữ số — dùng để ghép link zalo.me/tel: từ số điện thoại. */
function bdsDigitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function BdsContactBox({ property }: { property: BdsProperty }) {
  const { user } = useBdsAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  // property.contact_phone đã được server mask sẵn (vd "090xxxx678") nếu người
  // xem không phải chủ tin/kiểm duyệt viên. Nút gọi chia 2 bước: bấm lần đầu
  // chỉ lấy số thật qua GET .../reveal-phone rồi hiện ra (chưa gọi), bấm lần
  // 2 mới thật sự gọi — vừa hạn chế bot quét số hàng loạt, vừa tránh gọi
  // nhầm khi người dùng chỉ định bấm xem số.
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<'phone' | 'zalo' | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function ensureRealPhone(purpose: 'phone' | 'zalo'): Promise<string | null> {
    if (revealedPhone) return revealedPhone;

    setRevealing(purpose);
    setRevealError(null);

    try {
      const res = await bdsApi.get<BdsWrapped<{ phone: string }>>(
        `/properties/${property.slug}/reveal-phone`,
      );
      setRevealedPhone(res.data.phone);

      return res.data.phone;
    } catch {
      setRevealError('Không lấy được số điện thoại. Vui lòng thử lại.');

      return null;
    } finally {
      setRevealing(null);
    }
  }

  // Chia làm 2 bước bấm riêng biệt, giống hành vi tham khảo: lượt bấm đầu
  // chỉ HIỆN số thật (không gọi ngay, tránh gọi nhầm khi chỉ định bấm xem
  // số), người dùng thấy đúng số rồi mới chủ động bấm lần nữa để thật sự
  // gọi — lúc đó href đã là "tel:" thật nên để trình duyệt tự xử lý.
  async function handleCallClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (revealedPhone) return;

    e.preventDefault();
    await ensureRealPhone('phone');
  }

  async function handleZaloClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (property.contact_zalo) return; // link tĩnh, không cần lấy số

    e.preventDefault();
    const phone = await ensureRealPhone('zalo');

    if (phone) window.open(`https://zalo.me/${bdsDigitsOnly(phone)}`, '_blank', 'noopener,noreferrer');
  }

  // Nút "Lưu tin" phải phản ánh trạng thái thật trên server, không chỉ trạng thái
  // cục bộ của phiên hiện tại (nếu không, tin đã lưu vẫn hiện "Lưu tin").
  const { data: favorites } = useQuery({
    queryKey: ['bds', 'favorites'],
    enabled: !!user,
    queryFn: () => bdsApi.get<BdsPaginated<BdsProperty>>('/my/favorites'),
    select: (res) => res.data.map((item) => item.id),
  });

  const saved = favorites?.includes(property.id) ?? false;

  const favoriteMutation = useMutation({
    mutationFn: (nextSaved: boolean) =>
      nextSaved
        ? bdsApi.post(`/my/favorites/${property.id}`)
        : bdsApi.delete(`/my/favorites/${property.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bds', 'favorites'] }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      message: `Tôi quan tâm tới tin đăng "${property.title}". Vui lòng liên hệ lại với tôi.`,
    },
  });

  const { bdsAntiSpamFields } = useBdsAntiSpam();
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function onSubmit(values: ContactInput) {
    setServerError(null);

    try {
      await bdsApi.post(`/properties/${property.slug}/contact`, {
        ...values,
        ...bdsAntiSpamFields(honeypotRef.current?.value ?? ''),
      });
      setSent(true);
    } catch (error) {
      setServerError(
        error instanceof BdsApiError ? error.message : 'Không gửi được liên hệ. Vui lòng thử lại.',
      );
    }
  }

  function toggleFavorite() {
    if (!user) {
      router.push('/dang-nhap');

      return;
    }

    favoriteMutation.mutate(!saved);
  }

  return (
    <aside className="h-fit lg:sticky lg:top-20">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Liên hệ người đăng</p>
        <p className="mt-1 font-semibold text-gray-900">{property.contact_name}</p>
        {property.user?.company && (
          <p className="text-sm text-gray-600">{property.user.company}</p>
        )}

        <a
          href={revealedPhone ? `tel:${revealedPhone}` : `tel:${property.contact_phone}`}
          onClick={handleCallClick}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <BdsPhoneIcon />
          {revealing === 'phone'
            ? 'Đang lấy số…'
            : revealedPhone
              ? `${revealedPhone} · Bấm để gọi`
              : `${property.contact_phone} · Bấm để hiện số`}
        </a>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <a
            href={
              property.contact_zalo
                ? `https://zalo.me/${bdsDigitsOnly(property.contact_zalo)}`
                : (revealedPhone ? `https://zalo.me/${bdsDigitsOnly(revealedPhone)}` : '#')
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleZaloClick}
            className="flex items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            {revealing === 'zalo' ? 'Đang lấy số…' : 'Zalo'}
          </a>

          {property.contact_facebook ? (
            <a
              href={property.contact_facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Facebook
            </a>
          ) : (
            <span className="flex items-center justify-center rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
              Chưa có Facebook
            </span>
          )}

          {/*
            Kênh mạng xã hội cấp HỒ SƠ người đăng (property.user.social_*, quản
            lý ở /quan-ly/ho-so) — khác Zalo/Facebook ở trên vốn đặt riêng theo
            TỪNG tin. Theo yêu cầu: kênh nào không có link thì ẩn hẳn, không
            hiện placeholder "Chưa có …" như Facebook — vì đây là 3 kênh bổ
            sung, hiện placeholder cho cả 3 khi trống sẽ làm khối liên hệ dài
            không cần thiết. Xem CLAUDE.md §4.31.
          */}
          {property.user?.social_tiktok && (
            <a
              href={property.user.social_tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-100"
            >
              TikTok
            </a>
          )}

          {property.user?.social_youtube && (
            <a
              href={property.user.social_youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              YouTube
            </a>
          )}

          {property.user?.social_instagram && (
            <a
              href={property.user.social_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
            >
              Instagram
            </a>
          )}
        </div>

        {revealError && <p className="mt-2 text-xs text-red-600">{revealError}</p>}

        <button
          type="button"
          onClick={toggleFavorite}
          disabled={favoriteMutation.isPending}
          className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          {saved ? '★ Đã lưu tin' : '☆ Lưu tin'}
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-bold text-gray-900">Gửi yêu cầu liên hệ</h2>

        {sent ? (
          <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            Đã gửi thông tin tới người đăng. Bạn sẽ được liên hệ lại sớm.
          </p>
        ) : (
          <form
            // Bọc trong arrow function để việc đọc `honeypotRef.current` bên
            // trong `onSubmit` chỉ chạy lúc submit thật sự, không phải lúc
            // render (đọc ref lúc render vi phạm quy tắc thuần khiết của React).
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
            className="mt-3 space-y-3"
          >
            <BdsHoneypotField ref={honeypotRef} />

            <BdsField label="Họ tên" error={errors.name?.message}>
              <input {...register('name')} className={inputClass} placeholder="Nguyễn Văn A" />
            </BdsField>

            <BdsField label="Số điện thoại" error={errors.phone?.message}>
              <input {...register('phone')} className={inputClass} placeholder="0912345678" />
            </BdsField>

            <BdsField label="Email (không bắt buộc)" error={errors.email?.message}>
              <input {...register('email')} className={inputClass} placeholder="email@example.com" />
            </BdsField>

            <BdsField label="Lời nhắn" error={errors.message?.message}>
              <textarea {...register('message')} rows={3} className={inputClass} />
            </BdsField>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi…' : 'Gửi liên hệ'}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500';

function BdsField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function BdsPhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-.826 1.68l-1.293.646a11.05 11.05 0 0 0 5.56 5.56l.647-1.293a1.5 1.5 0 0 1 1.678-.826l3.224.716A1.5 1.5 0 0 1 18 14.352V15.5a1.5 1.5 0 0 1-1.5 1.5H15c-7.18 0-13-5.82-13-13v-.5Z" />
    </svg>
  );
}

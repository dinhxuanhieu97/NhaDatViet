'use client';

import { useState } from 'react';
import { BdsPasswordInput } from '@/components/bds-auth/BdsPasswordInput';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';

export default function BdsProfilePage() {
  const { user, refresh } = useBdsAuth();

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  });
  // Kênh mạng xã hội cấp hồ sơ — áp dụng cho mọi tin đăng của người này,
  // khác contact_zalo/contact_facebook đặt riêng theo từng tin ở bước "Liên
  // hệ" của wizard đăng tin. Tách state riêng để lưu qua một form riêng,
  // tránh submit nhầm khi chỉ muốn đổi tên/SĐT. Xem CLAUDE.md §4.31.
  const [socialLinks, setSocialLinks] = useState({
    social_tiktok: user?.social_tiktok ?? '',
    social_youtube: user?.social_youtube ?? '',
    social_instagram: user?.social_instagram ?? '',
  });
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  // "Ghi nhớ đăng nhập" ở đây nghĩa là: giữ nguyên phiên đang dùng trên máy
  // này sau khi đổi mật khẩu, chỉ đăng xuất các thiết bị/phiên khác. Bỏ tick
  // thì giữ hành vi gốc — đăng xuất luôn, kể cả thiết bị đang dùng.
  const [keepCurrentSession, setKeepCurrentSession] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);

    try {
      await bdsApi.put('/auth/profile', profile);
      await refresh();
      setProfileMessage('Đã cập nhật hồ sơ.');
    } catch (error) {
      setProfileMessage(
        error instanceof BdsApiError ? error.message : 'Không cập nhật được hồ sơ.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveSocialLinks(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSocialMessage(null);

    try {
      await bdsApi.put('/auth/profile', socialLinks);
      await refresh();
      setSocialMessage('Đã cập nhật kênh mạng xã hội.');
    } catch (error) {
      setSocialMessage(
        error instanceof BdsApiError
          ? (error.fieldError('social_tiktok')
              ?? error.fieldError('social_youtube')
              ?? error.fieldError('social_instagram')
              ?? error.message)
          : 'Không cập nhật được kênh mạng xã hội.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setPasswordMessage(null);

    try {
      const res = await bdsApi.put<{ message: string; logged_out: boolean }>('/auth/password', {
        ...passwords,
        keep_current_session: keepCurrentSession,
      });
      setPasswordMessage(res.message);
      setPasswords({ current_password: '', password: '', password_confirmation: '' });

      // Server đã thu hồi token của phiên này (logged_out) → làm mới thông
      // tin đăng nhập để tự phát hiện token hết hạn; BdsAuthGuard sẽ tự
      // chuyển về /dang-nhap khi user trở thành null, không cần tự điều
      // hướng thủ công ở đây.
      if (res.logged_out) {
        await refresh();
      }
    } catch (error) {
      setPasswordMessage(
        error instanceof BdsApiError
          ? (error.fieldError('current_password') ?? error.message)
          : 'Không đổi được mật khẩu.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="mt-0.5 text-sm text-gray-600">
          Email: {user?.email} · Vai trò: {user?.roles.join(', ')}
        </p>
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-900">Thông tin cơ bản</h2>

        <BdsProfileField label="Họ và tên">
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        <BdsProfileField label="Số điện thoại">
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        <BdsProfileField label="Công ty / Sàn môi giới">
          <input
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        {profileMessage && <p className="text-sm text-gray-700">{profileMessage}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Lưu thay đổi
        </button>
      </form>

      <form
        onSubmit={saveSocialLinks}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900">Kênh mạng xã hội</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Hiện kèm nút liên hệ trên mọi tin đăng của bạn. Bỏ trống kênh nào thì kênh đó tự ẩn
            khỏi tin đăng, không hiện nút trống.
          </p>
        </div>

        <BdsProfileField label="TikTok">
          <input
            type="url"
            value={socialLinks.social_tiktok}
            onChange={(e) => setSocialLinks({ ...socialLinks, social_tiktok: e.target.value })}
            className={bdsProfileInputClass}
            placeholder="https://tiktok.com/@ten-cua-ban"
          />
        </BdsProfileField>

        <BdsProfileField label="YouTube">
          <input
            type="url"
            value={socialLinks.social_youtube}
            onChange={(e) => setSocialLinks({ ...socialLinks, social_youtube: e.target.value })}
            className={bdsProfileInputClass}
            placeholder="https://youtube.com/@ten-cua-ban"
          />
        </BdsProfileField>

        <BdsProfileField label="Instagram">
          <input
            type="url"
            value={socialLinks.social_instagram}
            onChange={(e) =>
              setSocialLinks({ ...socialLinks, social_instagram: e.target.value })
            }
            className={bdsProfileInputClass}
            placeholder="https://instagram.com/ten-cua-ban"
          />
        </BdsProfileField>

        {socialMessage && <p className="text-sm text-gray-700">{socialMessage}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Lưu kênh mạng xã hội
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-900">Đổi mật khẩu</h2>

        <BdsProfileField label="Mật khẩu hiện tại">
          <BdsPasswordInput
            autoComplete="current-password"
            value={passwords.current_password}
            onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        <BdsProfileField label="Mật khẩu mới">
          <BdsPasswordInput
            autoComplete="new-password"
            value={passwords.password}
            onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        <BdsProfileField label="Nhập lại mật khẩu mới">
          <BdsPasswordInput
            autoComplete="new-password"
            value={passwords.password_confirmation}
            onChange={(e) =>
              setPasswords({ ...passwords, password_confirmation: e.target.value })
            }
            className={bdsProfileInputClass}
          />
        </BdsProfileField>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={keepCurrentSession}
            onChange={(e) => setKeepCurrentSession(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Ghi nhớ đăng nhập trên thiết bị này
        </label>
        <p className="-mt-2 text-xs text-gray-500">
          Bỏ tick thì thiết bị này cũng bị đăng xuất như các thiết bị khác sau khi đổi mật khẩu.
        </p>

        {passwordMessage && <p className="text-sm text-gray-700">{passwordMessage}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Đổi mật khẩu
        </button>
      </form>
    </div>
  );
}

const bdsProfileInputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500';

function BdsProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

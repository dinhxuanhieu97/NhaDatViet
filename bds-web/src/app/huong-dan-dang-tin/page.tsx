import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hướng dẫn đăng tin — Nhà Đất Việt',
  description:
    'Các bước đăng tin bán/cho thuê nhà đất, căn hộ, đất nền trên Nhà Đất Việt: '
    + 'từ tạo tài khoản, điền thông tin, tải ảnh đến gửi duyệt.',
  alternates: { canonical: '/huong-dan-dang-tin' },
};

interface BdsGuideStep {
  title: string;
  body: string;
  /** Ảnh chụp màn hình minh họa bước này, đặt trong public/huong-dan-dang-tin/. */
  image: { src: string; alt: string };
}

const BDS_GUIDE_STEPS: BdsGuideStep[] = [
  {
    title: '1. Tạo tài khoản',
    body: 'Bấm "Đăng ký" ở góc trên bên phải, nhập email/số điện thoại và mật khẩu. '
      + 'Tài khoản mặc định ở vai trò "Thành viên" — đăng được tối đa 5 tin cùng lúc. '
      + 'Nếu bạn là môi giới chuyên nghiệp và cần đăng nhiều tin hơn, dùng link '
      + '"Đăng ký tài khoản môi giới" để được nâng cấp.',
    image: { src: '/huong-dan-dang-tin/buoc-1-tao-tai-khoan.webp', alt: 'Màn hình đăng ký tài khoản' },
  },
  {
    title: '2. Bấm "Đăng tin" và chọn loại hình',
    body: 'Chọn Bán hoặc Cho thuê, sau đó chọn loại bất động sản: Đất, Nhà riêng, Căn hộ chung cư, '
      + 'hoặc gắn vào một Dự án có sẵn. Mỗi loại hình có bộ trường thông tin bắt buộc khác nhau '
      + '(ví dụ đất không có số phòng ngủ, căn hộ không có mặt tiền/lộ giới).',
    image: {
      src: '/huong-dan-dang-tin/buoc-2-loai-hinh.webp',
      alt: 'Bước 1 của wizard đăng tin: chọn Bán/Cho thuê và loại bất động sản',
    },
  },
  {
    title: '3. Nhập địa chỉ và chọn vị trí trên bản đồ',
    body: 'Chọn Tỉnh/Thành — Khu vực — Phường/Xã, nhập số nhà/tên đường, rồi bấm đúng vị trí trên '
      + 'bản đồ. Vị trí chính xác giúp tin đăng hiện đúng trong kết quả "Tìm theo bán kính" và '
      + 'tăng độ tin cậy với người mua.',
    image: {
      src: '/huong-dan-dang-tin/buoc-3-dia-chi-ban-do.webp',
      alt: 'Bước 2 của wizard đăng tin: nhập địa chỉ và ghim vị trí trên bản đồ',
    },
  },
  {
    title: '4. Điền thông tin bất động sản',
    body: 'Giá, diện tích, số phòng ngủ/phòng tắm, hướng nhà, tình trạng pháp lý, nội thất… '
      + 'Điền càng đầy đủ, tin càng dễ được tìm thấy khi người mua lọc theo tiêu chí.',
    image: {
      src: '/huong-dan-dang-tin/buoc-4-thong-tin-bds.webp',
      alt: 'Bước 3 của wizard đăng tin: điền diện tích, giá, số phòng và các thông tin khác',
    },
  },
  {
    title: '5. Đặt tiêu đề và mô tả',
    body: 'Tiêu đề nên nêu rõ loại hình, khu vực và điểm nổi bật (VD: "Bán nhà 2 tầng hẻm xe hơi '
      + 'Quận 12, sổ hồng riêng"). Mô tả nên trình bày đủ ý, tránh viết hoa toàn bộ hoặc lặp từ khóa '
      + 'quá nhiều — tin đăng sai quy cách có thể bị từ chối khi kiểm duyệt.',
    image: {
      src: '/huong-dan-dang-tin/buoc-5-tieu-de-mo-ta.webp',
      alt: 'Bước 4 của wizard đăng tin: nhập tiêu đề và mô tả chi tiết',
    },
  },
  {
    title: '6. Tải ảnh thực tế',
    body: 'Tải tối thiểu 1 ảnh (JPG/PNG/WebP, tối đa 5MB mỗi ảnh) — hạn mức 10 ảnh với tài khoản '
      + 'thành viên, 20 ảnh với môi giới. Ảnh được tự động nén WebP và chèn watermark, có thể mất '
      + 'vài giây để xử lý xong. Kéo thả ảnh để sắp xếp thứ tự hiển thị, và bấm "Đặt đại diện" để '
      + 'chọn ảnh bìa cho tin.',
    image: {
      src: '/huong-dan-dang-tin/buoc-6-tai-anh.webp',
      alt: 'Bước 5 của wizard đăng tin: tải ảnh lên và kéo thả để sắp xếp thứ tự',
    },
  },
  {
    title: '7. Thông tin liên hệ và xem trước',
    body: 'Kiểm tra tên và số điện thoại liên hệ hiển thị cho người mua. Trước khi gửi duyệt, bạn '
      + 'có thể bấm "Xem trước" ở danh sách tin đăng để xem tin sẽ hiển thị với người mua như thế nào.',
    image: {
      src: '/huong-dan-dang-tin/buoc-7-lien-he-xem-truoc.webp',
      alt: 'Bước 6 của wizard đăng tin: nhập thông tin liên hệ và xem trước tin đăng',
    },
  },
  {
    title: '8. Gửi duyệt',
    body: 'Sau khi gửi, tin chuyển sang trạng thái "Chờ duyệt". Đội kiểm duyệt sẽ xem xét nội dung '
      + 'và hình ảnh trước khi hiển thị công khai. Nếu bị từ chối, lý do cụ thể sẽ hiện ngay trong '
      + 'mục "Tin đăng của tôi" — bạn có thể sửa lại và gửi duyệt lại.',
    image: {
      src: '/huong-dan-dang-tin/buoc-8-gui-duyet.webp',
      alt: 'Tin đăng ở trạng thái "Chờ duyệt" sau khi gửi trong mục Tin đăng của tôi',
    },
  },
  {
    title: '9. Quản lý tin sau khi đăng',
    body: 'Tin được duyệt hiển thị công khai trong 30 ngày. Bạn có thể sửa, ẩn/hiện lại, hoặc xóa '
      + 'tin bất cứ lúc nào trong mục "Tin đăng của tôi". Sửa giá/diện tích/địa chỉ/tiêu đề của tin '
      + 'đã duyệt sẽ đưa tin về trạng thái chờ duyệt lại.',
    image: {
      src: '/huong-dan-dang-tin/buoc-9-quan-ly-tin.webp',
      alt: 'Trang "Tin đăng của tôi" với các nút Xem trước, Sửa, Xóa cho từng tin',
    },
  },
];

export default function BdsPostingGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-900">Hướng dẫn đăng tin</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn đăng tin</h1>
      <p className="mt-2 text-sm text-gray-600">
        9 bước để đăng một tin rao bán hoặc cho thuê nhà đất, căn hộ, đất nền — từ tạo tài khoản đến
        khi tin được duyệt và hiển thị công khai. Ảnh chụp minh họa bên dưới lấy từ chính giao diện
        đăng tin thật.
      </p>

      <ol className="mt-6 space-y-6">
        {BDS_GUIDE_STEPS.map((step) => (
          <li key={step.title} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="relative aspect-video w-full bg-gray-50">
              <Image
                src={step.image.src}
                alt={step.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover object-top"
              />
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-gray-900">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">Mẹo để tin đăng duyệt nhanh và thu hút hơn:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Dùng ảnh thật, chụp sáng và rõ nét — tránh ảnh lấy từ nguồn khác hoặc ảnh watermark của bên thứ ba.</li>
          <li>Giá và diện tích khớp với mô tả — sai lệch nhiều dễ bị người mua báo cáo tin sai sự thật.</li>
          <li>Cập nhật lại tin (ẩn/hiện hoặc sửa) khi bất động sản đã có người mua/thuê để tránh nhận liên hệ không cần thiết.</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/quan-ly/tin-dang/tao"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Đăng tin ngay
        </Link>
        <Link
          href="/dang-ky"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Đăng ký tài khoản
        </Link>
      </div>
    </div>
  );
}

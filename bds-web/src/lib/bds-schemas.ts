import { z } from 'zod';

// Khớp đúng đầu số di động Việt Nam đang được cấp phép (Viettel, MobiFone,
// VinaPhone, Vietnamobile, Gmobile, iTel, Wintel/Reddi) tính đến 2026 — phải
// giữ đồng bộ với App\Support\VietnamesePhone::REGEX ở backend. Không dùng
// `0[0-9]{8,10}` chung chung vì lọt cả đầu số cố định (02x) và đầu số di
// động chưa từng cấp (vd 060x, 095x, 057x). Chi tiết xem CLAUDE.md §4.23.
const phoneRegex = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  // "Ghi nhớ đăng nhập" — mặc định bật (đặt ở defaultValues của useForm) để
  // giữ hành vi trước đây (lưu token lâu dài); bỏ tick thì chỉ đăng nhập
  // trong phiên trình duyệt hiện tại. Dùng .optional() thay vì .default()
  // để type input/output của schema khớp nhau — tránh lỗi kiểu của
  // zodResolver khi input/output type lệch nhau.
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(120),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất 1 chữ cái')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
    password_confirmation: z.string(),
    company: z.string().max(150).optional(),
    remember: z.boolean().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['password_confirmation'],
  });

// ------------------------------------------------- Form đăng tin theo từng bước

export const step1Schema = z.object({
  listing_type: z.enum(['sale', 'rent'], { message: 'Vui lòng chọn nhu cầu' }),
  category_id: z.coerce.number().int().positive('Vui lòng chọn loại bất động sản'),
});

export const step2Schema = z.object({
  province_id: z.coerce.number().int().positive('Vui lòng chọn tỉnh/thành phố'),
  district_id: z.coerce.number().int().positive('Vui lòng chọn quận/huyện'),
  ward_id: z.coerce.number().int().positive().optional().nullable(),
  address: z.string().min(5, 'Địa chỉ tối thiểu 5 ký tự').max(255),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

const numberOrNull = z.union([z.coerce.number(), z.literal('')]).transform((v) => (v === '' ? null : v));

export const step3BaseSchema = z.object({
  area: z.coerce.number().positive('Diện tích phải lớn hơn 0').max(1_000_000),
  price: numberOrNull.nullable().optional(),
  price_unit: z.enum(['total', 'per_m2', 'per_month']).default('total'),
  bedrooms: numberOrNull.nullable().optional(),
  bathrooms: numberOrNull.nullable().optional(),
  floors: numberOrNull.nullable().optional(),
  direction: z
    .enum(['dong', 'tay', 'nam', 'bac', 'dong-nam', 'tay-nam', 'dong-bac', 'tay-bac'])
    .optional()
    .nullable(),
  legal_status: z
    .enum(['red_book', 'pink_book', 'sale_contract', 'waiting', 'other'])
    .optional()
    .nullable(),
  furniture: z.enum(['full', 'basic', 'none']).optional().nullable(),
  frontage: numberOrNull.nullable().optional(),
  road_width: numberOrNull.nullable().optional(),
});

/**
 * Ràng buộc thêm theo loại hình — khớp với BdsPropertyType::requiredFields() ở backend.
 * Giữ 2 phía đồng bộ để người dùng không phải chờ round-trip mới thấy lỗi.
 */
export function step3SchemaFor(type: string) {
  const required: Record<string, string[]> = {
    land: ['frontage', 'road_width', 'legal_status'],
    house: ['bedrooms', 'bathrooms', 'floors', 'legal_status'],
    apartment: ['bedrooms', 'bathrooms', 'furniture'],
    project: [],
  };

  const fields = required[type] ?? [];

  return step3BaseSchema.superRefine((data, ctx) => {
    fields.forEach((field) => {
      const value = (data as Record<string, unknown>)[field];

      if (value === null || value === undefined || value === '') {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Trường này bắt buộc với loại bất động sản đã chọn',
        });
      }
    });
  });
}

export const step4Schema = z.object({
  title: z
    .string()
    .min(30, 'Tiêu đề tối thiểu 30 ký tự')
    .max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z
    .string()
    .min(50, 'Mô tả tối thiểu 50 ký tự')
    .max(10_000, 'Mô tả tối đa 10.000 ký tự'),
});

export const step6Schema = z.object({
  contact_name: z.string().min(2, 'Vui lòng nhập tên liên hệ').max(120),
  contact_phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contact_zalo: z.string().regex(phoneRegex, 'Số Zalo không hợp lệ').optional().or(z.literal('')),
  contact_facebook: z.string().url('Link Facebook không hợp lệ').optional().or(z.literal('')),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên').max(120),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  message: z.string().max(1000).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

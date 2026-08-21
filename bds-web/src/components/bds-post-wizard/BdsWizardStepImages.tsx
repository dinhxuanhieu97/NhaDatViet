'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { useBdsMyProperty } from '@/lib/bds-queries';
import type { BdsProperty, BdsPropertyImage, BdsWrapped } from '@/types/bds';

interface BdsWizardStepImagesProps {
  propertyId?: number;
  imageLimit: number;
  /** Lưu tin ở dạng nháp để có id trước khi upload ảnh. */
  onEnsureProperty: () => Promise<number | null>;
}

export function BdsWizardStepImages({
  propertyId,
  imageLimit,
  onEnsureProperty,
}: BdsWizardStepImagesProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: property, refetch } = useBdsMyProperty(propertyId);
  const images = property?.images ?? [];

  const sensors = useSensors(
    // Cần kéo lệch tối thiểu 8px mới tính là drag, để bấm nút "Đặt đại diện" / "Xóa"
    // trong tile (không dùng làm tay cầm kéo) vẫn hoạt động bình thường.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadImages = async () => {
    await refetch();
  };

  /**
   * Lưu thứ tự ảnh (kéo thả) hoặc đổi ảnh đại diện — dùng chung một API
   * `PUT /my/properties/{id}/images/order`. Cập nhật lạc quan (optimistic)
   * vào cache TanStack Query để kéo thả mượt, không phải đợi round-trip API;
   * nếu API lỗi thì phục hồi lại thứ tự cũ.
   */
  async function persistOrder(order: number[], primaryId?: number) {
    if (!propertyId) return;

    const queryKey = ['bds', 'my-property', propertyId] as const;
    const previous = queryClient.getQueryData<BdsWrapped<BdsProperty>>(queryKey);

    queryClient.setQueryData<BdsWrapped<BdsProperty>>(queryKey, (old) => {
      if (!old?.data.images) return old;

      const byId = new Map(old.data.images.map((img) => [img.id, img]));
      const reordered = order
        .map((id) => byId.get(id))
        .filter((img): img is BdsPropertyImage => Boolean(img))
        .map((img) => ({ ...img, is_primary: primaryId ? img.id === primaryId : img.is_primary }));

      return { ...old, data: { ...old.data, images: reordered } };
    });

    try {
      await bdsApi.put(`/my/properties/${propertyId}/images/order`, {
        order,
        primary_id: primaryId,
      });
    } catch {
      if (previous) queryClient.setQueryData(queryKey, previous);
      setError('Không lưu được thứ tự ảnh. Vui lòng thử lại.');
    } finally {
      await queryClient.invalidateQueries({ queryKey });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex);

    void persistOrder(reordered.map((img) => img.id));
  }

  async function onSelectFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      // Ảnh cần gắn với một tin đã tồn tại → lưu nháp trước nếu chưa có id.
      const id = propertyId ?? (await onEnsureProperty());

      if (!id) {
        setError('Cần lưu thông tin tin đăng trước khi tải ảnh lên.');

        return;
      }

      const form = new FormData();

      Array.from(files).forEach((file) => form.append('images[]', file));

      await bdsApi.post(`/my/properties/${id}/images`, form);
      await loadImages();
    } catch (err) {
      setError(
        err instanceof BdsApiError
          ? (err.fieldError('images') ?? err.message)
          : 'Không tải được ảnh lên. Vui lòng thử lại.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(imageId: number) {
    if (!propertyId) return;

    try {
      await bdsApi.delete(`/my/properties/${propertyId}/images/${imageId}`);
      await loadImages();
    } catch {
      setError('Không xóa được ảnh.');
    }
  }

  function setPrimary(imageId: number) {
    void persistOrder(
      images.map((img) => img.id),
      imageId,
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700">
          Hình ảnh bất động sản
          <span className="ml-2 text-xs font-normal text-gray-500">
            {images.length}/{imageLimit} ảnh · JPG, PNG, WebP · tối đa 5MB mỗi ảnh
          </span>
        </p>

        <label
          className={`mt-2 flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition ${
            uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-brand-500'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || images.length >= imageLimit}
            onChange={(e) => void onSelectFiles(e.target.files)}
            className="hidden"
          />
          <span className="text-2xl">📷</span>
          <span className="mt-1 text-sm text-gray-600">
            {uploading
              ? 'Đang tải ảnh lên…'
              : images.length >= imageLimit
                ? 'Đã đạt số ảnh tối đa'
                : 'Bấm để chọn ảnh hoặc kéo thả vào đây'}
          </span>
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {images.length > 0 && (
        <>
          <p className="text-xs text-gray-500">
            Kéo thả để sắp xếp thứ tự hiển thị — ảnh đầu tiên (nếu chưa đặt đại diện riêng) sẽ
            hiện ở vị trí bìa của tin đăng.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image) => (
                  <BdsSortableImageTile
                    key={image.id}
                    image={image}
                    onSetPrimary={() => setPrimary(image.id)}
                    onRemove={() => void removeImage(image.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <p className="rounded-md bg-blue-50 p-3 text-xs text-blue-900">
        Ảnh được tự động thu nhỏ, nén sang định dạng WebP và chèn watermark ở chế độ nền, nên có thể
        mất vài giây để hiển thị bản tối ưu. Tin đăng cần ít nhất 1 ảnh mới gửi duyệt được.
      </p>
    </div>
  );
}

interface BdsSortableImageTileProps {
  image: BdsPropertyImage;
  onSetPrimary: () => void;
  onRemove: () => void;
}

/** Một ô ảnh kéo-thả-được trong lưới sắp xếp thứ tự hình ảnh tin đăng. */
function BdsSortableImageTile({ image, onSetPrimary, onRemove }: BdsSortableImageTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-4/3 overflow-hidden rounded-lg border border-gray-200 ${
        isDragging ? 'z-10 opacity-70 shadow-lg' : ''
      }`}
    >
      <Image src={image.thumb_url} alt="Ảnh bất động sản" fill sizes="200px" className="object-cover" />

      {image.is_primary && (
        <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Ảnh đại diện
        </span>
      )}

      {!image.is_processed && (
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          Đang tối ưu…
        </span>
      )}

      <button
        type="button"
        aria-label="Kéo để sắp xếp lại thứ tự ảnh"
        className="absolute right-1 top-1 cursor-grab touch-none rounded bg-white/90 px-1.5 py-1 text-xs leading-none text-gray-700 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition group-hover:opacity-100">
        {!image.is_primary && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-900"
          >
            Đặt đại diện
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

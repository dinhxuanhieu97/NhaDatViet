import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BdsPropertyGallery } from '@/components/bds-property/BdsPropertyGallery';
import { BdsPropertySpecs } from '@/components/bds-property/BdsPropertySpecs';
import { BdsContactBox } from '@/components/bds-property/BdsContactBox';
import { BdsSimilarPropertiesSlide } from '@/components/bds-property/BdsSimilarPropertiesSlide';
import { BdsPropertyMap } from '@/components/bds-map/BdsPropertyMap';
import { BDS_SITE_URL } from '@/lib/bds-config';
import { fetchBdsProperty, fetchBdsSimilarProperties } from '@/lib/bds-server-api';
import { formatArea, formatDate, formatNumber } from '@/lib/bds-format';

export const revalidate = 60; // ISR 1 phút

interface BdsPropertyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BdsPropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchBdsProperty(slug);

  if (!property) {
    return { title: 'Không tìm thấy tin đăng' };
  }

  const location = [property.district?.name, property.province?.name].filter(Boolean).join(', ');
  const description = `${property.price_text} · ${formatArea(property.area)}`
    + `${property.bedrooms ? ` · ${property.bedrooms} phòng ngủ` : ''} · ${location}. `
    + property.description.slice(0, 120);

  return {
    title: property.title,
    description,
    alternates: { canonical: `/bat-dong-san/${property.slug}` },
    openGraph: {
      type: 'article',
      title: property.title,
      description,
      url: `${BDS_SITE_URL}/bat-dong-san/${property.slug}`,
      images: property.primary_image ? [{ url: property.primary_image }] : undefined,
      publishedTime: property.published_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description,
    },
  };
}

export default async function BdsPropertyDetailPage({ params }: BdsPropertyPageProps) {
  const { slug } = await params;
  const property = await fetchBdsProperty(slug);

  if (!property) {
    notFound();
  }

  const similar = await fetchBdsSimilarProperties(slug);
  const location = [property.district?.name, property.province?.name].filter(Boolean).join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    url: `${BDS_SITE_URL}/bat-dong-san/${property.slug}`,
    datePosted: property.published_at,
    description: property.description,
    image: property.images?.map((img) => img.url) ?? [],
    offers: property.price
      ? { '@type': 'Offer', price: property.price, priceCurrency: 'VND' }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.district?.name,
      addressRegion: property.province?.name,
      addressCountry: 'VN',
    },
    geo:
      property.latitude && property.longitude
        ? { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude }
        : undefined,
    floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' },
    numberOfRooms: property.bedrooms ?? undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: BDS_SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: property.listing_type === 'sale' ? 'Nhà đất bán' : 'Nhà đất cho thuê',
        item: `${BDS_SITE_URL}/${property.listing_type === 'sale' ? 'nha-dat-ban' : 'nha-dat-cho-thue'}`,
      },
      { '@type': 'ListItem', position: 3, name: property.title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            href={property.listing_type === 'sale' ? '/nha-dat-ban' : '/nha-dat-cho-thue'}
            className="hover:text-brand-600"
          >
            {property.listing_type === 'sale' ? 'Nhà đất bán' : 'Nhà đất cho thuê'}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900">{property.category?.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article>
            <BdsPropertyGallery images={property.images ?? []} title={property.title} />

            <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">{property.title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {property.address}
              {location && `, ${location}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-6 rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-xs text-gray-500">Mức giá</p>
                <p className="text-lg font-bold text-brand-600">{property.price_text}</p>
                {property.price_per_m2_text && (
                  <p className="text-xs text-gray-500">{property.price_per_m2_text}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Diện tích</p>
                <p className="text-lg font-bold text-gray-900">{formatArea(property.area)}</p>
              </div>
              {property.bedrooms !== null && (
                <div>
                  <p className="text-xs text-gray-500">Phòng ngủ</p>
                  <p className="text-lg font-bold text-gray-900">{property.bedrooms} PN</p>
                </div>
              )}
              {property.bathrooms !== null && (
                <div>
                  <p className="text-xs text-gray-500">Phòng tắm</p>
                  <p className="text-lg font-bold text-gray-900">{property.bathrooms} WC</p>
                </div>
              )}
            </div>

            <section className="mt-6">
              <h2 className="mb-2 text-base font-bold text-gray-900">Thông tin mô tả</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {property.description}
              </p>
            </section>

            <section className="mt-6">
              <h2 className="mb-2 text-base font-bold text-gray-900">Đặc điểm bất động sản</h2>
              <BdsPropertySpecs property={property} />
            </section>

            {property.latitude && property.longitude && (
              <section className="mt-6">
                <h2 className="mb-2 text-base font-bold text-gray-900">Vị trí trên bản đồ</h2>
                <BdsPropertyMap
                  lat={property.latitude}
                  lng={property.longitude}
                  title={property.title}
                />
              </section>
            )}

            <p className="mt-6 text-xs text-gray-500">
              Ngày đăng: {formatDate(property.published_at)} · Lượt xem:{' '}
              {formatNumber(property.views_count)} · Mã tin: #{property.id}
            </p>
          </article>

          <BdsContactBox property={property} />
        </div>

        {similar.length > 0 && <BdsSimilarPropertiesSlide properties={similar} />}
      </div>
    </>
  );
}

import VendorPageClient from '@/components/vendor-page-client';

type VendorPageProps = {
  params: {
    id: string;
  };
};

export default function VendorPage({ params }: VendorPageProps) {
  return <VendorPageClient id={params.id} />;
}

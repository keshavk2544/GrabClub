import CategoryPageClient from '@/components/category-page-client';

type CategoryPageProps = {
  params: {
    slug: string;
  };
};

export default function CategoryPage({ params }: CategoryPageProps) {
  return <CategoryPageClient slug={params.slug} />;
}

import { resources } from '@/config/resources';
import { ResourcePage } from '@/features/resource-page';
import { UnavailableState } from '@/components/common/states';
export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const resource = resources.find((r) => r.route === path);
  if (!resource)
    return (
      <UnavailableState description="This assigned route does not yet have a documented module configuration." />
    );
  return <ResourcePage key={resource.key} resource={resource} />;
}

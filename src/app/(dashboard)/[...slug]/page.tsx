import { normalizeResourceRoute, resources } from '@/config/resources';
import { ResourcePage } from '@/features/resource-page';
import { MasterPage } from '@/features/master-page';
import { WorkSessionPage } from '@/features/work-session-page';
import { RolePage } from '@/features/role-page';
import { UserPage } from '@/features/user-page';
import { UnavailableState } from '@/components/common/states';
export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = normalizeResourceRoute('/' + slug.join('/'));
  const resource = resources.find((r) => r.route === path);
  if (!resource)
    return (
      <UnavailableState description="This assigned route does not yet have a documented module configuration." />
    );
  if (resource.key === 'roles') return <RolePage />;
  if (resource.key === 'users') return <UserPage />;
  if (resource.key === 'work-sessions') return <WorkSessionPage />;
  if (
    resource.key === 'shifts' ||
    resource.key === 'machines' ||
    resource.key === 'components' ||
    resource.key === 'downtime-categories'
  )
    return <MasterPage kind={resource.key} />;
  return <ResourcePage key={resource.key} resource={resource} />;
}

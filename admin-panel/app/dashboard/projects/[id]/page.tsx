import { ProjectDetails } from '@/src/components/projects/ProjectDetails';

export default function ProjectPage({ params }: { params: { id: string } }) {
    return <ProjectDetails id={params.id} />;
}

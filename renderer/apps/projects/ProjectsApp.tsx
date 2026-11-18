import { EmptyState } from "../../components/common/EmptyState";

/** The home screen. A placeholder until the project grid lands. */
export default function ProjectsApp() {
  return (
    <div className="app-root projects">
      <EmptyState icon="folder" title="No projects yet" body="Projects you add will show up here." />
    </div>
  );
}

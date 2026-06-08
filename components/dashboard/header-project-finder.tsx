import useProjectFinder from "@/hooks/use-project-finder";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "../ui/input";

function HeaderProjectFinder() {
  const tSidebar = useTranslations("dashboard.sidebar");
  const { searchTerm, setSearchTerm, projects, loading } = useProjectFinder();
  return (
    <div className="relative hidden lg:block">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={tSidebar("searchPlaceholder")}
        className="h-9 w-64 bg-muted/50 pl-9"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div
        className="absolute top-full mt-1 w-full rounded-md bg-popover text-popover-foreground shadow-lg p-2"
        hidden={projects.length === 0 && searchTerm.length === 0}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Searching...</p>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <a
              href={`/projects/${project.id}`}
              key={project.id}
              className="cursor-pointer p-2 rounded-md hover:bg-accent"
            >
              <h5 className="text-sm">{project.name}</h5>
              <p className="text-xs text-muted-foreground">
                {project.description}
              </p>
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No projects found.</p>
        )}
      </div>
    </div>
  );
}

export default HeaderProjectFinder;

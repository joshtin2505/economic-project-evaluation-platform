import { ProjectRecord } from "@/lib/services/project-analytics";
import { fetchProjectBySearchTerm } from "@/lib/services/projects";
import { useEffect, useState } from "react";

export default function useProjectFinder() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const term = searchTerm.trim();

      if (!term) {
        setProjects([]);
        return;
      }
      setLoading(true);
      fetchProjectBySearchTerm(term)
        .then((data) => {
          setProjects(data);
        })
        .catch(() => {
          setProjects([]);
        })
        .finally(() => setLoading(false));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  return {
    projects,
    searchTerm,
    setSearchTerm,
    loading,
  };
}

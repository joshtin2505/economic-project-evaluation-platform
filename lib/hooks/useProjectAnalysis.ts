import { useEffect, useMemo, useState } from "react";
import * as projectService from "@/lib/services/projects";
import {
  selectFeaturedProject,
  type CashFlowRecord,
  type ProjectRecord,
} from "@/lib/services/project-analytics";

interface UseProjectAnalysisOptions {
  requireResults?: boolean;
}

export function useProjectAnalysis(options: UseProjectAnalysisOptions = {}) {
  const { requireResults = false } = options;
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [selectedCashFlows, setSelectedCashFlows] = useState<CashFlowRecord[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectRows =
          (await projectService.fetchProjects()) as ProjectRecord[];
        setProjects(projectRows);

        const eligible = requireResults
          ? projectRows.filter((project) => project.results)
          : projectRows;

        const defaultProject = selectFeaturedProject(eligible);
        if (defaultProject) {
          setSelectedProjectId(defaultProject.id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load projects",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, [requireResults]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const loadSelectedProject = async () => {
      try {
        const [projectDetail, cashFlowRows] = await Promise.all([
          projectService.fetchProjectById(selectedProjectId),
          projectService.fetchCashFlows(selectedProjectId),
        ]);

        setSelectedProject(projectDetail as ProjectRecord);
        setSelectedCashFlows((cashFlowRows ?? []) as CashFlowRecord[]);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load project details",
        );
      }
    };

    void loadSelectedProject();
  }, [selectedProjectId]);

  const projectOptions = useMemo(
    () =>
      requireResults
        ? projects.filter((project) => project.results)
        : projects,
    [projects, requireResults],
  );

  return {
    projects,
    projectOptions,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    selectedCashFlows,
    isLoading,
    error,
  };
}

import { describe, it, expect } from "vitest";
import projects from "../data/projects.json";

describe("Projects Data", () => {
  describe("Project Structure", () => {
    it("should have valid project entries", () => {
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);

      projects.forEach((project) => {
        expect(project).toHaveProperty("name");
        expect(project).toHaveProperty("description");
        expect(project).toHaveProperty("tags");
        expect(project.tags).toBeInstanceOf(Array);
      });
    });

    it("should have projects with live demos", () => {
      const liveProjects = projects.filter(
        (p) =>
          p.live &&
          p.live !== "https://atlasit.example" &&
          p.live.startsWith("http")
      );
      expect(liveProjects.length).toBeGreaterThan(0);

      liveProjects.forEach((project) => {
        expect(project.live).toMatch(/^https?:\/\//);
        expect(project.status).toBeDefined();
      });
    });
  });

  describe("Technical Architecture Section", () => {
    it("should have projects showcasing different technologies", () => {
      const allTags = projects.flatMap((p) => p.tags);
      const uniqueTags = [...new Set(allTags)];

      // Should have diverse technology stack
      expect(uniqueTags.length).toBeGreaterThan(5);

      // Should include modern web technologies
      const tagText = uniqueTags.join(" ").toLowerCase();
      expect(tagText).toMatch(/javascript|react|node|cloudflare|astro/);
    });

    it("should have projects with GitHub repositories", () => {
      const projectsWithGithub = projects.filter((p) => p.github);
      expect(projectsWithGithub.length).toBeGreaterThan(0);

      projectsWithGithub.forEach((project) => {
        expect(project.github).toMatch(/^https?:\/\/github\.com\//);
      });
    });
  });

  describe("Demo Page Integration", () => {
    it("should filter out placeholder projects for demo display", () => {
      const displayProjects = projects.filter(
        (p) => p.live && p.live !== "https://atlasit.example"
      );
      expect(displayProjects.length).toBeLessThanOrEqual(projects.length);
    });

    it("should have projects with proper status indicators", () => {
      const statusProjects = projects.filter((p) => p.status);
      expect(statusProjects.length).toBeGreaterThan(0);

      statusProjects.forEach((project) => {
        expect([
          "production",
          "development",
          "demo",
          "preview",
          "concept",
        ]).toContain(project.status);
      });
    });
  });
});

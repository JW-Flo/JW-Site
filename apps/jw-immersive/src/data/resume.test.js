import { describe, it, expect } from "vitest";
import resumeData from "../data/resume.json";

describe("Resume Data", () => {
  describe("Name Consistency", () => {
    it('should use "Joe Whittle" as the primary name', () => {
      expect(resumeData.name).toBe("Joe Whittle");
    });

    it("should have consistent name in contact information", () => {
      expect(resumeData.contact.email).toContain("joe.whittle");
      expect(resumeData.contact.github).toBe("JW-Flo");
    });
  });

  describe("Data Structure", () => {
    it("should have all required top-level properties", () => {
      const requiredProps = [
        "name",
        "title",
        "location",
        "summary",
        "skills",
        "highlights",
        "experience",
        "tools",
        "education",
        "certifications",
        "contact",
      ];

      requiredProps.forEach((prop) => {
        expect(resumeData).toHaveProperty(prop);
      });
    });

    it("should have realistic experience entries", () => {
      expect(resumeData.experience).toBeInstanceOf(Array);
      expect(resumeData.experience.length).toBeGreaterThan(0);

      resumeData.experience.forEach((exp) => {
        expect(exp).toHaveProperty("company");
        expect(exp).toHaveProperty("position");
        expect(exp).toHaveProperty("duration");
        expect(exp).toHaveProperty("description");
        expect(exp.description).toBeInstanceOf(Array);
      });
    });

    it("should have valid certifications", () => {
      expect(resumeData.certifications).toBeInstanceOf(Array);
      expect(resumeData.certifications.length).toBeGreaterThan(0);

      resumeData.certifications.forEach((cert) => {
        expect(cert).toHaveProperty("name");
        expect(cert).toHaveProperty("issuer");
        expect(cert).toHaveProperty("issued");
      });
    });
  });

  describe("Skills Validation", () => {
    it("should have comprehensive cybersecurity skills", () => {
      const skills = resumeData.skills;
      expect(skills).toBeInstanceOf(Array);
      expect(skills.length).toBeGreaterThan(10);

      // Check for key cybersecurity skills
      const skillText = skills.join(" ").toLowerCase();
      expect(skillText).toMatch(/threat|security|incident|response/);
      expect(skillText).toMatch(/cloud|aws|azure/);
      expect(skillText).toMatch(/identity|access|iam/);
    });

    it("should have relevant tools and technologies", () => {
      const tools = resumeData.tools;
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(5);

      const toolText = tools.join(" ").toLowerCase();
      expect(toolText).toMatch(/aws|terraform|docker/);
    });
  });
});

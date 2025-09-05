import { describe, it, expect } from "vitest";
import { siteMeta } from "../data/siteMeta.ts";

describe("Site Metadata", () => {
  describe("Name Consistency", () => {
    it('should use "Joe Whittle" consistently', () => {
      expect(siteMeta.siteName).toBe("Joe Whittle");
      expect(siteMeta.defaultTitle).toBe(
        "Joe Whittle | Cybersecurity Engineer"
      );
      expect(siteMeta.author).toBe("Joe Whittle");
    });
  });

  describe("Metadata Structure", () => {
    it("should have all required properties", () => {
      expect(siteMeta).toHaveProperty("siteName");
      expect(siteMeta).toHaveProperty("defaultTitle");
      expect(siteMeta).toHaveProperty("description");
      expect(siteMeta).toHaveProperty("author");
      expect(siteMeta).toHaveProperty("keywords");
    });

    it("should have appropriate description", () => {
      const description = siteMeta.description.toLowerCase();
      expect(description).toContain("cybersecurity");
      expect(description).toContain("engineer");
    });

    it("should have relevant keywords", () => {
      const keywords = siteMeta.keywords;
      expect(keywords).toBeInstanceOf(Array);
      expect(keywords.length).toBeGreaterThan(5);

      const keywordText = keywords.join(" ").toLowerCase();
      expect(keywordText).toMatch(/cybersecurity|security|engineer/);
    });
  });
});

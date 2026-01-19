import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";

// Mock Next.js navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("SidebarNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders all navigation items", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Coupons" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Available Coupons" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Campaigns" })).toBeInTheDocument();
  });

  it("renders header text", () => {
    render(<SidebarNav />);

    expect(screen.getByText(/McDonald's MCP/i)).toBeInTheDocument();
    expect(screen.getByText("Control Center")).toBeInTheDocument();
  });

  it("renders footer text about token", () => {
    render(<SidebarNav />);

    expect(screen.getByText(/Token sourced from/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep it secret/i)).toBeInTheDocument();
  });

  describe("active route highlighting", () => {
    it("highlights Dashboard when on homepage", () => {
      mockUsePathname.mockReturnValue("/");
      render(<SidebarNav />);

      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      expect(dashboardLink.className).toContain("bg-amber-400/20");
      expect(dashboardLink.className).toContain("text-amber-200");
    });

    it("highlights My Coupons when on /coupons", () => {
      mockUsePathname.mockReturnValue("/coupons");
      render(<SidebarNav />);

      const couponsLink = screen.getByRole("link", { name: "My Coupons" });
      expect(couponsLink.className).toContain("bg-amber-400/20");
      expect(couponsLink.className).toContain("text-amber-200");
    });

    it("highlights Available Coupons when on /available", () => {
      mockUsePathname.mockReturnValue("/available");
      render(<SidebarNav />);

      const availableLink = screen.getByRole("link", { name: "Available Coupons" });
      expect(availableLink.className).toContain("bg-amber-400/20");
      expect(availableLink.className).toContain("text-amber-200");
    });

    it("highlights Campaigns when on /campaigns", () => {
      mockUsePathname.mockReturnValue("/campaigns");
      render(<SidebarNav />);

      const campaignsLink = screen.getByRole("link", { name: "Campaigns" });
      expect(campaignsLink.className).toContain("bg-amber-400/20");
      expect(campaignsLink.className).toContain("text-amber-200");
    });

    it("applies inactive styles to non-active links", () => {
      mockUsePathname.mockReturnValue("/coupons");
      render(<SidebarNav />);

      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      expect(dashboardLink.className).toContain("text-slate-100");
      expect(dashboardLink.className).toContain("hover:bg-slate-800/70");
      expect(dashboardLink.className).not.toContain("bg-amber-400/20");
    });
  });

  describe("navigation links", () => {
    it("has correct href for Dashboard", () => {
      render(<SidebarNav />);
      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      expect(dashboardLink).toHaveAttribute("href", "/");
    });

    it("has correct href for My Coupons", () => {
      render(<SidebarNav />);
      const couponsLink = screen.getByRole("link", { name: "My Coupons" });
      expect(couponsLink).toHaveAttribute("href", "/coupons");
    });

    it("has correct href for Available Coupons", () => {
      render(<SidebarNav />);
      const availableLink = screen.getByRole("link", { name: "Available Coupons" });
      expect(availableLink).toHaveAttribute("href", "/available");
    });

    it("has correct href for Campaigns", () => {
      render(<SidebarNav />);
      const campaignsLink = screen.getByRole("link", { name: "Campaigns" });
      expect(campaignsLink).toHaveAttribute("href", "/campaigns");
    });
  });

  describe("layout structure", () => {
    it("renders as aside element", () => {
      const { container } = render(<SidebarNav />);
      const aside = container.querySelector("aside");
      expect(aside).toBeInTheDocument();
    });

    it("applies correct styling classes", () => {
      const { container } = render(<SidebarNav />);
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("w-64");
      expect(aside?.className).toContain("border-r");
      expect(aside?.className).toContain("bg-slate-900/70");
    });

    it("renders nav element", () => {
      const { container } = render(<SidebarNav />);
      const nav = container.querySelector("nav");
      expect(nav).toBeInTheDocument();
    });
  });
});

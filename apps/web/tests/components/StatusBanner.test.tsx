import { render, screen } from "@testing-library/react";
import { StatusBanner } from "@/components/StatusBanner";

describe("StatusBanner", () => {
  it("renders title", () => {
    render(<StatusBanner title="Test Title" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders message when provided", () => {
    render(<StatusBanner title="Title" message="Test message" />);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("does not render message element when message is not provided", () => {
    const { container } = render(<StatusBanner title="Title" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1); // Only title paragraph
  });

  it("renders action when provided", () => {
    render(
      <StatusBanner
        title="Title"
        action={<button>Click me</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("does not render action element when action is not provided", () => {
    render(<StatusBanner title="Title" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  describe("tone variants", () => {
    it("applies info tone styles by default", () => {
      const { container } = render(<StatusBanner title="Info" />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("bg-sky-50");
      expect(banner.className).toContain("text-sky-900");
      expect(banner.className).toContain("border-sky-200");
    });

    it("applies success tone styles", () => {
      const { container } = render(<StatusBanner title="Success" tone="success" />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("bg-emerald-50");
      expect(banner.className).toContain("text-emerald-900");
      expect(banner.className).toContain("border-emerald-200");
    });

    it("applies warning tone styles", () => {
      const { container } = render(<StatusBanner title="Warning" tone="warning" />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("bg-amber-50");
      expect(banner.className).toContain("text-amber-900");
      expect(banner.className).toContain("border-amber-200");
    });

    it("applies error tone styles", () => {
      const { container } = render(<StatusBanner title="Error" tone="error" />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("bg-rose-50");
      expect(banner.className).toContain("text-rose-900");
      expect(banner.className).toContain("border-rose-200");
    });
  });

  describe("complete banner with all props", () => {
    it("renders all elements together", () => {
      render(
        <StatusBanner
          tone="warning"
          title="Warning Title"
          message="This is a warning message"
          action={<button>Fix it</button>}
        />
      );

      expect(screen.getByText("Warning Title")).toBeInTheDocument();
      expect(screen.getByText("This is a warning message")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Fix it" })).toBeInTheDocument();
    });
  });

  describe("action element", () => {
    it("renders complex action elements", () => {
      render(
        <StatusBanner
          title="Title"
          action={
            <div>
              <button>Button 1</button>
              <button>Button 2</button>
            </div>
          }
        />
      );

      expect(screen.getByRole("button", { name: "Button 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Button 2" })).toBeInTheDocument();
    });

    it("renders link as action", () => {
      render(
        <StatusBanner
          title="Title"
          action={<a href="/test">Learn more</a>}
        />
      );

      expect(screen.getByRole("link", { name: "Learn more" })).toBeInTheDocument();
    });
  });
});

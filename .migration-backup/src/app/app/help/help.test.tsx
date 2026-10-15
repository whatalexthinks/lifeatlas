import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HelpPage from "./page";

describe("Help", () => {
  it("filters answers as you type and says when nothing matches", async () => {
    render(<HelpPage />);
    expect(screen.getByText("Is my archive backed up?")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search help" }), "microphone");
    expect(screen.getByText("The microphone won't start")).toBeInTheDocument();
    expect(screen.queryByText("Is my archive backed up?")).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole("searchbox", { name: "Search help" }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Search help" }), "zzzz");
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("keeps the send button off until there's enough to read", async () => {
    render(<HelpPage />);
    const send = screen.getByRole("button", { name: "Save message" });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText("What's happening?"), "The microphone stays silent on my tablet.");
    expect(send).toBeEnabled();
  });
});

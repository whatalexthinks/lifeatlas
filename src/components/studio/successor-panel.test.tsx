import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDemoStore } from "@/store/demo-store";
import { seed } from "@/tests/fixtures";
import { SuccessorPanel } from "./successor-panel";

beforeEach(() => {
  useDemoStore.setState({ db: seed(), hydrated: true });
});

describe("SuccessorPanel", () => {
  it("saves a successor locally, without contacting them, and can remove them", async () => {
    render(<SuccessorPanel />);
    await userEvent.type(screen.getByLabelText("Name"), "Ruth Comeau");
    await userEvent.type(screen.getByLabelText("Relationship"), "Cousin");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    const item = await screen.findByText("Ruth Comeau");
    const row = item.closest("li")!;
    expect(within(row).getByText("Saved · not contacted")).toBeInTheDocument();
    expect(useDemoStore.getState().db.successors.some((s) => s.name === "Ruth Comeau")).toBe(true);
    await userEvent.click(within(row).getByRole("button", { name: "Remove Ruth Comeau" }));
    expect(useDemoStore.getState().db.successors.some((s) => s.name === "Ruth Comeau")).toBe(false);
  });

  it("explains a bad email instead of saving", async () => {
    render(<SuccessorPanel />);
    await userEvent.type(screen.getByLabelText("Name"), "Ruth");
    await userEvent.type(screen.getByLabelText("Relationship"), "Cousin");
    await userEvent.type(screen.getByLabelText(/Email/), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

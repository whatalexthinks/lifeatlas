import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PlanPricing } from "./pricing";

afterEach(cleanup);

describe("monthly-first launch pricing", () => {
  it("opens with actual monthly prices and passes the selected interval to checkout", () => {
    const { container } = render(<MemoryRouter><PlanPricing /></MemoryRouter>);
    expect(screen.getByRole("radio", { name: /^monthly/i }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("$7.99")).toBeTruthy();
    expect(screen.getByText("$14.99")).toBeTruthy();
    expect(container.querySelector('a[href="/checkout/preview?product=digital&interval=month"]')).toBeTruthy();
    expect(container.querySelector('a[href="/checkout/preview?product=family&interval=month"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: /^yearly/i }));
    expect(screen.getByText("$79")).toBeTruthy();
    expect(screen.getByText("$149")).toBeTruthy();
    expect(container.querySelector('a[href="/checkout/preview?product=digital&interval=year"]')).toBeTruthy();
    expect(container.querySelector('a[href="/checkout/preview?product=family&interval=year"]')).toBeTruthy();
    expect(screen.getByRole("radio", { name: /^yearly/i }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: /^monthly/i }));
    expect(screen.getByText("$7.99")).toBeTruthy();
    expect(container.querySelector('a[href="/checkout/preview?product=digital&interval=month"]')).toBeTruthy();
  });
});

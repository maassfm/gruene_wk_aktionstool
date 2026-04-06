/**
 * Sicherheitstests: Content-Security-Policy Header
 *
 * Prüft, dass der CSP-Header alle erforderlichen Direktiven enthält
 * und keine gefährlichen Direktiven gesetzt sind.
 */
import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config";

describe("CSP Header Configuration", () => {
  it("should have a Content-Security-Policy header configured", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)");
    expect(catchAllRoute).toBeDefined();

    const cspHeader = catchAllRoute!.headers.find(
      (h) => h.key === "Content-Security-Policy"
    );
    expect(cspHeader).toBeDefined();
    expect(cspHeader!.value).toBeTruthy();
  });

  it("should contain default-src 'self'", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("default-src 'self'");
  });

  it("should contain script-src 'self'", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("script-src 'self'");
  });

  it("should contain style-src 'self' 'unsafe-inline' for Leaflet compatibility", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("should contain img-src 'self' data: https: for Leaflet marker icons", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it("should contain connect-src 'self' https://*.tile.openstreetmap.org for map tiles", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain(
      "connect-src 'self' https://*.tile.openstreetmap.org"
    );
  });

  it("should contain font-src 'self'", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("font-src 'self'");
  });

  it("should contain frame-src 'none'", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toContain("frame-src 'none'");
  });

  it("should NOT contain 'unsafe-eval' (XSS vector)", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("should NOT contain nonce (out of scope per D-04)", async () => {
    const headersConfig = await nextConfig.headers!();
    const catchAllRoute = headersConfig.find((h) => h.source === "/(.*)")!;
    const csp = catchAllRoute.headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).not.toContain("nonce");
  });
});

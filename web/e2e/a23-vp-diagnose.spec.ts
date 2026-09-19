import { test } from "@playwright/test";
import fs from "node:fs";

/**
 * Diagnosis only — harness probes, no widget edits.
 * Writes /tmp/a23-vp-diagnose.json
 */

test("diagnose member VP mount", async ({ page }) => {
  const consoles: { type: string; text: string }[] = [];
  const failed: { url: string; status?: number; failure?: string }[] = [];
  const pending: string[] = [];
  const finished: { url: string; status: number }[] = [];

  page.on("console", (msg) => {
    consoles.push({ type: msg.type(), text: msg.text().slice(0, 500) });
  });
  page.on("pageerror", (e) => {
    consoles.push({ type: "pageerror", text: e.message });
  });
  page.on("requestfailed", (req) => {
    failed.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });
  page.on("response", (res) => {
    finished.push({ url: res.url(), status: res.status() });
    if (res.status() >= 400) {
      failed.push({ url: res.url(), status: res.status() });
    }
  });

  await page.addInitScript(() => {
    const g = window as unknown as {
      __vpDiag: {
        canvasAppends: number;
        createChartCalls: number;
      };
    };
    g.__vpDiag = { canvasAppends: 0, createChartCalls: 0 };
    const proto = Element.prototype.appendChild;
    Element.prototype.appendChild = function (c) {
      if (c && (c as HTMLElement).tagName === "CANVAS") {
        g.__vpDiag.canvasAppends += 1;
      }
      return proto.call(this, c);
    };
  });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL((u) => !u.pathname.includes("dev-login"), {
    timeout: 30_000,
  });

  await page.goto("/app/options-lab/volume-profile");
  await page.waitForSelector('[data-testid="sa-price-chart"]', {
    timeout: 45_000,
  });
  await page.waitForTimeout(8000);

  const inFlight = page
    .context()
    .serviceWorkers();
  void inFlight;

  const probe = await page.evaluate(() => {
    const host = document.querySelector(
      '[data-testid="sa-price-chart"]',
    ) as HTMLElement | null;
    const inner = host?.firstElementChild as HTMLElement | null;
    const scripts = [...document.scripts].map((s) => ({
      src: s.src,
      type: s.type,
    }));
    const next = document.getElementById("__NEXT_DATA__")?.textContent?.slice(
      0,
      200,
    );
    const g = window as unknown as {
      __vpDiag?: { canvasAppends: number; createChartCalls: number };
    };
    return {
      readyState: document.readyState,
      vis: document.visibilityState,
      hidden: document.hidden,
      host: host
        ? {
            w: host.clientWidth,
            h: host.clientHeight,
            paint: host.getAttribute("data-vp-paint"),
            canvases: host.querySelectorAll("canvas").length,
            innerW: inner?.clientWidth,
            innerH: inner?.clientHeight,
            innerHTML: host.innerHTML.slice(0, 400),
          }
        : null,
      diag: g.__vpDiag || null,
      nextData: !!next,
      scriptCount: scripts.length,
      lwcScripts: scripts.filter((s) =>
        /lightweight|saPrice|SaPrice|sa-price/i.test(s.src),
      ),
      reactRoot: !!document.querySelector("[data-vp-paint]"),
    };
  });

  const reqs = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => {
    const x = r as PerformanceResourceTiming;
    return {
      name: x.name,
      dur: Math.round(x.duration),
      transfer: x.transferSize,
      type: x.initiatorType,
    };
  }));

  const out = {
    probe,
    consoles,
    failed,
    finished4xx: finished.filter((f) => f.status >= 400),
    finishedSample: finished.slice(0, 80),
    finishedCount: finished.length,
    resources: reqs.filter(
      (r) =>
        /chunk|lightweight|volume-profile|saPrice|failed|error/i.test(r.name) ||
        r.transfer === 0,
    ),
  };
  fs.writeFileSync("/tmp/a23-vp-diagnose.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
});

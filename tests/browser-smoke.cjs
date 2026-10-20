const path = require("node:path");

const playwrightRoot = process.env.SENVARA_PLAYWRIGHT_ROOT;
const { chromium } = playwrightRoot ? require(playwrightRoot) : require("playwright");
const axePath = require.resolve("axe-core/axe.min.js", { paths: [path.join(__dirname, "..", "frontend")] });

const baseURL = process.env.SENVARA_BASE_URL || "http://127.0.0.1:3000";
const executablePath = process.env.SENVARA_CHROMIUM || "";
const routes = ["/", "/open/", "/record/", "/workbench/", "/method/"];
const alice = "0x1111111111111111111111111111111111111111";
const bob = "0x2222222222222222222222222222222222222222";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkA11y(page, route, viewport) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ["violations"] });
    return result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
    }));
  });
  assert(violations.length === 0, `axe violations at ${route} (${viewport.width}px): ${JSON.stringify(violations)}`);
}

async function installWalletHarness(page) {
  await page.addInitScript(({ alice, bob }) => {
    const calls = [];
    const listeners = new WeakMap();
    const makeProvider = (name, account, initialChain, rejectRequest = false) => {
      let chain = initialChain;
      const authorizationKey = `senvara.harness.authorized.${name}`;
      let authorized = window.sessionStorage.getItem(authorizationKey) === "1";
      let rejectNextRequest = rejectRequest;
      const persistAuthorization = () => window.sessionStorage.setItem(authorizationKey, authorized ? "1" : "0");
      const provider = {
        name,
        calls,
        async request({ method, params }) {
          calls.push({ name, method, params });
          if (method === "eth_accounts") return authorized ? [account] : [];
          if (method === "eth_requestAccounts") {
            if (rejectNextRequest) { rejectNextRequest = false; const error = new Error("User rejected"); error.code = 4001; throw error; }
            authorized = true;
            persistAuthorization();
            return [account];
          }
          if (method === "eth_chainId") return chain;
          if (method === "wallet_switchEthereumChain") { chain = params[0].chainId; return null; }
          if (method === "wallet_addEthereumChain") { chain = params[0].chainId; return null; }
          throw new Error(`Unsupported test wallet method: ${method}`);
        },
        on(event, handler) {
          const current = listeners.get(provider) || new Map();
          const handlers = current.get(event) || [];
          handlers.push(handler);
          current.set(event, handlers);
          listeners.set(provider, current);
        },
        removeListener(event, handler) {
          const current = listeners.get(provider);
          const handlers = current?.get(event) || [];
          current?.set(event, handlers.filter(candidate => candidate !== handler));
        },
        emit(event, value) {
          if (event === "accountsChanged") { authorized = Array.isArray(value) && value.length > 0; persistAuthorization(); }
          for (const handler of listeners.get(provider)?.get(event) || []) handler(value);
        },
        authorize() { authorized = true; persistAuthorization(); },
        rejectNext() { rejectNextRequest = true; },
      };
      return provider;
    };
    const meta = makeProvider("MetaMask", alice, "0xf22f");
    const rabby = makeProvider("Rabby", bob, "0x1", true);
    window.__senvaraWalletHarness = { calls, meta, rabby, alice, bob };
    window.ethereum = { providers: [meta, rabby] };
    window.addEventListener("eip6963:requestProvider", () => {
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: { info: { uuid: "meta-uuid", name: "MetaMask", rdns: "io.metamask" }, provider: meta } }));
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: { info: { uuid: "rabby-uuid", name: "Rabby", rdns: "io.rabby" }, provider: rabby } }));
    });
  }, { alice, bob });
}

async function checkRoutes(browser) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });
    for (const route of routes) {
      const response = await page.goto(baseURL + route, { waitUntil: "networkidle" });
      assert(response && response.status() === 200, `${route} returned ${response?.status()}`);
      await page.waitForTimeout(150);
      const result = await page.evaluate(() => ({
        title: document.title,
        configured: document.body.dataset.senvaraConfigured,
        contract: document.body.dataset.senvaraContract,
        contractVersion: document.body.dataset.senvaraContractVersion,
        sourceSha256: document.body.dataset.senvaraSourceSha256,
        body: document.body.innerText.trim(),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        appError: /Application error|Unhandled Runtime Error|Internal Server Error/i.test(document.body.innerText),
        controls: [...document.querySelectorAll("a,button,input,textarea,select")].filter(element => {
          const style = getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden";
        }).length,
        unlabeledControls: [...document.querySelectorAll("a,button")].filter(element => {
          const label = element.getAttribute("aria-label") || element.textContent?.trim();
          return !label;
        }).length,
        unlabeledFields: [...document.querySelectorAll("input,textarea,select")].filter(element => !element.getAttribute("aria-label") && !element.labels?.length).length,
      }));
      assert(result.title.length > 0, `${route} has no document title`);
      assert(result.configured === "true", `${route} did not expose an active release identity`);
      assert(result.contract?.toLowerCase() === "0xf563d381c3ec5bda61f166bb1fff781de6b81b8c", `${route} exposed the wrong active contract`);
      assert(result.contractVersion === "0.2.0", `${route} exposed the wrong active contract version`);
      assert(result.sourceSha256 === "d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2", `${route} exposed the wrong active source fingerprint`);
      assert(result.body.length > 100, `${route} has unexpectedly empty body`);
      assert(!result.appError, `${route} rendered an application error`);
      assert(result.overflow <= 1, `${route} overflows viewport by ${result.overflow}px at ${viewport.width}px`);
      assert(result.controls > 0, `${route} has no interactive controls`);
      assert(result.unlabeledControls === 0, `${route} has ${result.unlabeledControls} unlabeled links/buttons`);
      assert(result.unlabeledFields === 0, `${route} has ${result.unlabeledFields} unlabeled form fields`);
      await checkA11y(page, route, viewport);
      if (viewport.width === 390) {
        await page.getByRole("button", { name: "Toggle navigation" }).click();
        assert(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible(), `${route} mobile navigation did not open`);
      }
    }
    assert(errors.length === 0, `browser errors at ${viewport.width}px: ${errors.join(" | ")}`);
    await page.close();
  }
}

async function checkPublicRead(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(baseURL + "/open/", { waitUntil: "networkidle" });
  await page.getByText(/public questions recorded/).waitFor({ state: "visible" });
  const body = await page.locator("body").innerText();
  assert(!/Awaiting the first deployment/i.test(body), "configured frontend still rendered predeployment state");
  const alerts = await page.locator('.inline-error[role="alert"]').allTextContents();
  const alertMarkup = await page.locator('.inline-error[role="alert"]').evaluateAll(elements => elements.map(element => element.outerHTML));
  assert(alerts.length === 0, `public record read returned an error: ${alerts.join(" | ")} ${alertMarkup.join(" | ")}`);
  assert(/No records in this range|View record/i.test(body), "public observatory did not render a canonical record state");
  await page.close();
}

async function checkKeyboardAndRecovery(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(baseURL + "/workbench/", { waitUntil: "networkidle" });
  const tabbed = [];
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    tabbed.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, name: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 40) })));
  }
  assert(tabbed.some(item => item.tag === "BUTTON"), "keyboard traversal never reached a button");
  assert(tabbed.some(item => item.tag === "INPUT" || item.tag === "TEXTAREA" || item.tag === "SELECT"), "keyboard traversal never reached form controls");
  const submit = page.getByRole("button", { name: /Record the question/ });
  assert(!await submit.isDisabled(), "configured workbench unexpectedly disabled the unsigned submit control");
  await submit.click();
  assert(await page.locator('.inline-error[role="alert"]').isVisible(), "invalid unsigned workbench submission did not surface validation feedback");
  await page.close();
}

async function checkRpcFailureRecovery(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route("https://studio.genlayer.com/api", route => route.abort());
  await page.goto(baseURL + "/record/?id=1", { waitUntil: "networkidle" });
  await page.locator('.error-screen [role="alert"]').waitFor({ state: "visible" });
  assert(await page.getByRole("button", { name: "Retry read" }).isVisible(), "failed RPC state did not expose retry recovery");
  await page.getByRole("button", { name: "Retry read" }).click();
  await page.locator('.error-screen [role="alert"]').waitFor({ state: "visible" });
  assert(await page.getByRole("button", { name: "Retry read" }).isVisible(), "RPC retry did not preserve a safe recoverable state");
  await page.close();
}

async function checkWalletHarness(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await installWalletHarness(page);
  await page.goto(baseURL + "/", { waitUntil: "networkidle" });
  const walletButton = page.getByRole("button", { name: /Connect wallet/ });
  await walletButton.click();
  assert(await page.getByRole("button", { name: /MetaMask/ }).isVisible(), "EIP-6963 MetaMask option was not discovered");
  assert(await page.getByRole("button", { name: /Rabby/ }).isVisible(), "EIP-6963 Rabby option was not discovered");
  assert(await page.locator(".wallet-option").count() === 2, "duplicate legacy/EIP-6963 announcements created duplicate wallet options");
  await page.getByRole("button", { name: /MetaMask/ }).click();
  await page.waitForTimeout(100);
  assert(await page.getByText("0x1111", { exact: false }).first().isVisible(), "MetaMask connection did not establish a session");
  await page.reload({ waitUntil: "networkidle" });
  assert(await page.getByText("0x1111", { exact: false }).first().isVisible(), "authorized wallet session was not passively restored after reload");
  await page.evaluate(() => window.__senvaraWalletHarness.meta.emit("accountsChanged", [window.__senvaraWalletHarness.bob]));
  await page.waitForTimeout(50);
  assert(await page.getByText("0x2222", { exact: false }).first().isVisible(), "active wallet account change was not reflected");
  await page.locator(".wallet-pill").click();
  await page.getByRole("button", { name: /Disconnect from this app/ }).click();
  await page.getByRole("button", { name: /Connect wallet/ }).click();
  await page.getByRole("button", { name: /Rabby/ }).click();
  assert(await page.getByRole("alert").getByText(/rejected/i).isVisible(), "wallet rejection was not surfaced as a safe error");
  await page.getByRole("button", { name: /Close wallet panel/ }).click();
  await page.getByRole("button", { name: /Connect wallet/ }).click();
  await page.getByRole("button", { name: /Rabby/ }).click();
  await page.waitForTimeout(100);
  assert(await page.getByText("Wrong network: 1").isVisible(), "wrong-network session was not shown");
  await page.getByRole("button", { name: /Switch to Studionet/ }).click();
  await page.waitForTimeout(100);
  assert(await page.getByText("Connected to Studionet 61999").isVisible(), "network switch/add recovery did not reconcile the active chain");
  const callMethods = await page.evaluate(() => window.__senvaraWalletHarness.calls.map(call => call.method));
  assert(callMethods.includes("eth_requestAccounts"), "wallet harness did not exercise account request");
  assert(callMethods.includes("eth_chainId"), "wallet harness did not exercise chain read");
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    await checkRoutes(browser);
    await checkPublicRead(browser);
    await checkKeyboardAndRecovery(browser);
    await checkRpcFailureRecovery(browser);
    await checkWalletHarness(browser);
    console.log("browser smoke: routes, responsive layout, axe accessibility, keyboard traversal, recovery, EIP-6963 discovery, rejection, account change, and network switch passed");
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });

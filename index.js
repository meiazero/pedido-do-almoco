import { puppeteer } from "puppeteer";
require("dotenv").config();

const FORM_URL = "https://bit.ly/pedido-do-almoco";
const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD;
const NOME_COMPLETO = "";
const MATRICULA = "";


/**
 * Use com cautela, pois pode banir sua conta do Google
 */

(async () => {
  // Configurações mais detalhadas do navegador
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-size=1366,768",
      "--disable-notifications",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  // Criar uma nova página
  const page = await browser.newPage();

  // Configurar o user agent para parecer um navegador real
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );

  // Modificar o navigator.webdriver
  await page.evaluateOnNewDocument(() => {
    // Remover a flag do webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // Criar um navigator.languages padrão
    Object.defineProperty(navigator, "languages", {
      get: () => ["pt-BR", "pt", "en-US", "en"],
    });

    // Adicionar plugins para parecer mais com um navegador real
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        {
          0: { type: "application/x-google-chrome-pdf" },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin",
        },
      ],
    });
  });

  // URL do formulário de login do Google
  await page.goto("https://accounts.google.com", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // Login na conta Google com delay entre digitações
  await page.type('input[type="email"]', GOOGLE_EMAIL, {
    delay: 100,
  });
  await new Promise((r) => setTimeout(r, 1000)); // Esperar 1 segundo
  await page.click("#identifierNext");

  // Aguardar e inserir a senha
  await page.waitForSelector('input[type="password"]', {
    visible: true,
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500)); // Esperar 1 segundo
  await page.type('input[type="password"]', GOOGLE_PASSWORD, {
    delay: 100,
  });
  await new Promise((r) => setTimeout(r, 1000)); // Esperar 1 segundo
  await page.click("#passwordNext");

  // Aguardar autenticação e redirecionar para o formulário
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
  await page.goto(FORM_URL, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // Marcar envio por email
  await page.waitForSelector('div[role="checkbox"]');
  const checkboxes = await page.$$('div[role="checkbox"]');
  await checkboxes[0].click(); // Primeiro checkbox (enviar por email)
  await new Promise((r) => setTimeout(r, 1000)); // Esperar 1 segundo

  // Preencher o formulário com delays para simular comportamento humano
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', NOME_COMPLETO, {
    delay: 50,
  });

  // Matrícula
  const inputs = await page.$$('input[type="text"]');
  await inputs[1].type(MATRICULA, { delay: 50 });

  // Marcar interesse
  await page.waitForSelector('div[role="checkbox"]');
  await new Promise((r) => setTimeout(r, 1000)); // Esperar 1 segundo
  await page.click('div[role="checkbox"]');

  // Enviar formulário
  await new Promise((r) => setTimeout(r, 1500)); // Esperar 1,5 segundo
  await page.waitForSelector('div[role="button"]');
  await page.click('div[role="button"]');

  // // Aguardar confirmação do envio
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });

  // // Fechar o navegador
  await browser.close();

  console.log("Agendamento realizado com sucesso!");
})();

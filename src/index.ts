import puppeteer, { Browser, Page } from 'puppeteer';
import { browserConfig } from './config';

interface FormConfig {
  formUrl: string;
  googleEmail: string;
  googlePassword: string;
  nomeCompleto: string;
  matricula: string;
}

const config: FormConfig = {
  formUrl: 'https://bit.ly/pedido-do-almoco',
  googleEmail: process.env.GOOGLE_EMAIL!,
  googlePassword: process.env.GOOGLE_PASSWORD!,
  nomeCompleto: 'Nome de Teste',
  matricula: '444445',
};

class FormAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await puppeteer.launch(browserConfig);
    this.page = await this.browser.newPage();
    await this.setupBrowserEnvironment();
  }

  private async setupBrowserEnvironment() {
    if (!this.page) return;

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    );

    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: { type: 'application/x-google-chrome-pdf' },
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
            name: 'Chrome PDF Plugin',
          },
        ],
      });
    });
  }

  async login() {
    if (!this.page) return;

    await this.page.goto('https://accounts.google.com', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    await this.page.waitForSelector('#identifierId', {
      visible: true,
      timeout: 1500,
    });
    await this.page.type('#identifierId', config.googleEmail, { delay: 150 });
    await this.delay(1000);
    await this.page.click('.VfPpkd-LgbsSe-OWXEXe-k8QpJ');

    await this.page.waitForSelector(
      '#password > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)',
    );
    await this.delay(1500);
    await this.page.type(
      '#password > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)',
      config.googlePassword,
      { delay: 150 },
    );

    await this.delay(1000);
    await this.page.click('.VfPpkd-LgbsSe-OWXEXe-k8QpJ');
    await this.page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: 10000,
    });
  }

  async fillForm() {
    if (!this.page) return;

    await this.page.goto(config.formUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    await this.page.click('#i5');
    await this.delay(1000);

    const nameSelector =
      'div.Qr7Oae:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)';
    const matriculaSelector =
      'div.Qr7Oae:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)';

    await this.page.waitForSelector(nameSelector);
    await this.page.type(nameSelector, config.nomeCompleto, { delay: 150 });

    await this.page.waitForSelector(matriculaSelector);
    await this.page.type(matriculaSelector, config.matricula, { delay: 150 });

    await this.page.click('#i24');
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const automation = new FormAutomation();
  try {
    await automation.init();
    await automation.login();
    await automation.fillForm();
    // await automation.close();
    console.log('Agendamento realizado com sucesso!');
  } catch (error) {
    console.error('Error:', error);
    await automation.close();
  }
}

main();

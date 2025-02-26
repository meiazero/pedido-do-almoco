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
  nomeCompleto: '',
  matricula: '',
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

    console.log('Iniciando login...');
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
    console.log('Login realizado com sucesso.');
  }

  async fillForm() {
    if (!this.page) return;
    try {
      console.log('Navegando até o formulário...');
      await this.page.goto(config.formUrl, {
        waitUntil: 'networkidle0',
        timeout: 50000,
      });

      // Trata o checkbox (selector #i5)
      await this.page.waitForSelector('#i5');
      const isChecked = await this.page.$eval(
        '#i5',
        el => el.getAttribute('aria-checked') === 'true',
      );
      if (!isChecked) {
        console.log('Checkbox não marcado. Clicando para marcar...');
        await this.page.click('#i5');
      } else {
        console.log('Checkbox já está marcado.');
      }
      await this.delay(1000);

      // Seletores dos campos
      const nameSelector =
        'div.Qr7Oae:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)';
      const matriculaSelector =
        'div.Qr7Oae:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input:nth-child(1)';

      // Preenche o campo de nome
      await this.page.waitForSelector(nameSelector);
      await this.page.evaluate(selector => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) input.value = '';
      }, nameSelector);
      await this.page.type(nameSelector, config.nomeCompleto, { delay: 150 });

      // Preenche o campo de matrícula
      await this.page.waitForSelector(matriculaSelector);
      await this.page.evaluate(selector => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) input.value = '';
      }, matriculaSelector);
      await this.page.type(matriculaSelector, config.matricula, { delay: 150 });

      // Clica no botão de envio (selector .Y5sE8d)
      await this.page.waitForSelector('.Y5sE8d');
      await this.page.click('.Y5sE8d');
      console.log('Formulário preenchido e enviado.');
    } catch (error) {
      console.error('Erro ao preencher o formulário:', error);
      throw error;
    }
  }

  async verifyOrder(): Promise<boolean> {
    if (!this.page) return false;
    const confirmationPhrase = 'Sua resposta foi registrada.';
    try {
      console.log('Aguardando 4 segundos para a exibição da confirmação...');
      await this.delay(4000);
      console.log('Verificando a presença da mensagem de confirmação...');
      await this.page.waitForFunction(
        phrase => document.body.innerText.includes(phrase),
        { timeout: 10000 },
        confirmationPhrase,
      );
      console.log('Confirmação encontrada!');
      return true;
    } catch (error) {
      console.error('Confirmação não encontrada:', error);
      return false;
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser fechado.');
    }
  }
}

async function main() {
  const automation = new FormAutomation();
  try {
    await automation.init();
    await automation.login();

    const maxRetries = 3;
    let success = false;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Tentativa ${attempt + 1} de preencher o formulário.`);
      await automation.fillForm();
      const confirmed = await automation.verifyOrder();
      if (confirmed) {
        success = true;
        break;
      } else {
        console.error(`Tentativa ${attempt + 1} falhou. Retentando...`);
      }
    }
    if (!success) {
      throw new Error('Falha ao confirmar o pedido após múltiplas tentativas.');
    }
    console.log('Agendamento realizado com sucesso!');
  } catch (error) {
    console.error('Erro na automação:', error);
  } finally {
    await automation.close();
  }
}

main();

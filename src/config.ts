const isProduction = process.env.NODE_ENV === 'production';

export const browserConfig = {
  headless: isProduction,
  defaultViewport: null,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-size=1366,768',
    '--disable-notifications',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-blink-features=AutomationControlled',
  ],
  ignoreDefaultArgs: ['--enable-automation'],
};

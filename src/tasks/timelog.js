const puppeteer = require("puppeteer");
const chalk = require("chalk");
const cosmiconfig = require("cosmiconfig");

const {
  isDebugging,
  getHours,
  getMinutes,
  composeMessage
} = require("../utils");

const logTime = async (
  page,
  description,
  hours,
  minutes,
  taskType,
  project,
  date = new Date().toJSON().slice(0, 10)
) => {
  process.stdout.write("👉 Logging time…");

  await page.waitForSelector("#id_when");
  await typeInInput(page, "#id_when", date);

  await page.waitForSelector(".timelog__project-field input.search");
  await typeInInput(page, ".timelog__project-field input.search", project);

  await page.waitForSelector(".timelog__type-field input.search");
  await typeInInput(page, ".timelog__type-field input.search", taskType);

  await page.waitForSelector("#id_hours");
  await typeInInput(page, "#id_hours", `${hours}`);

  await page.waitForSelector("#id_minutes");
  await typeInInput(page, "#id_minutes", `${minutes}`);

  await page.waitForSelector("#id_description");
  await typeInInput(page, "#id_description", description);

  const loading = page.waitForSelector("#timelog-submit-btn");
  await page.click("#timelog-submit-btn");

  await loading;

  process.stdout.write(
    chalk`\r👌 Successfully logged {red ${hours && hours + "h"}${minutes &&
      " " + minutes + "min"}} on project {red ${project}}!\r\n`
  );
};

export const loginUser = async (page, email, password) => {
  process.stdout.write(`👉 Logging as ${email}…`);

  await page.goto(
    "https://teamtrack.venturedevs.com/accounts/login/?next=/timelog/index/",
    { waitUntil: "networkidle2" }
  );

  await page.type("#id_login", email);
  await page.type("#id_password", password);

  const loginButtonSelector = ".login__button";
  await page.waitForSelector(loginButtonSelector);
  const awaiting = page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.click(loginButtonSelector);
  await awaiting;

  try {
    const errorMessageSelector = ".ui.error.message > p";
    await page.waitForSelector(errorMessageSelector, { timeout: 200 });
    const error = await page.$(errorMessageSelector);

    process.stdout.write(`\r❌ Logging as ${email}\r\n`);
    const text = await page.evaluate(error => error.textContent, error);
    process.stdout.write(chalk`🙀 {red ${text}}\r\n`);

    return false;
  } catch (e) {
    process.stdout.write(`\r👌 Logging as ${email}\r\n`);

    return true;
  }
};

export const typeInInput = async (page, selector, text) => {
  const elementHandle = await page.$(selector);
  await elementHandle.click();
  await elementHandle.focus();
  await elementHandle.click({ clickCount: 3 });
  await elementHandle.press("Backspace");
  await elementHandle.type(text);
};

export const timelogTask = async ({ flags, input }) => {
  const [cmd, time, ...taskName] = input;

  const explorer = cosmiconfig("teamtracker");
  const configFound = await explorer.search();

  let flagsWithConfig = { ...flags };
  if (configFound) {
    flagsWithConfig = { ...configFound.config, ...flagsWithConfig };
  }

  if (!flagsWithConfig.email || !flagsWithConfig.password) {
    console.log(
      chalk`{red You have to provide} {red.inverse email} {red and} {red.inverse password} {red values!} \n\n💡 Use flags {red.inverse --email name@venturedevs.com} or {red.inverse --password yourPassword} or define in config file`
    );
    return;
  }

  if (!flagsWithConfig.project || !flagsWithConfig.type) {
    console.log(
      chalk`{red You have to provide} {red.inverse email} {red and} {red.inverse password} {red values!} \n\n💡 Use flags {red.inverse --project YourProjectName} or {red.inverse --type Meeting} or define in config file`
    );
    return;
  }

  let browser = await puppeteer.launch(isDebugging(flags.debug));
  let page = await browser.newPage();

  try {
    await loginUser(page, flagsWithConfig.email, flagsWithConfig.password);
    await logTime(
      page,
      composeMessage(...taskName),
      getHours(time),
      getMinutes(time),
      flagsWithConfig.type,
      flagsWithConfig.project,
      flagsWithConfig.date || undefined
    );
  } catch (error) {
    browser.close();
    process.exit(1);
  } finally {
    browser.close();
  }
};

timelogTask.help = chalk`Logs new activity to TeamTracker.

          {gray.inverse $ teamtracker timelog HH:MM Description [flags]}

          Required flags (if not defined in config):
            {gray --email} - User's email
            {gray --password} - User's password
            {gray --project} - Project where log time
            {gray --type} - Task type (possible values: {green Task}, {green Meeting}, {green Other})
            
          Optional flags:
            {gray --date} - Work date (format: {green 2019-02-20}). 
                     {gray If not defined will use today's date.}
          
          Examples: 
            {gray.inverse $ teamtracker timelog 1:30 Doing something}
            {gray.inverse $ teamtracker timelog 1:15 Release meeting --type Meeting}
            {gray.inverse $ teamtracker timelog 0:25 Old task --date 2019-02-01}`;

module.exports = timelogTask;

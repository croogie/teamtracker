const get = require("lodash/get");

const isDebugging = (debug = false) => {
  const debuggingMode = {
    headless: false,
    slowMo: 100,
    devtools: true
  };

  return debug ? debuggingMode : {};
};

const log = (debug = false) => (...message) => {
  if (debug) {
    console.log(...message);
  }
};

const timeRegex = /^(\d+):(\d+)$/;
const composeMessage = (...args) => args.join(" ");
const getHours = time => parseInt(get(time.match(timeRegex), "[1]", false), 10);
const getMinutes = time =>
  parseInt(get(time.match(timeRegex), "[2]", false), 10);

module.exports = {
  isDebugging,
  log,
  getHours,
  getMinutes,
  composeMessage
};

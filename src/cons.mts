import logSymbols from "log-symbols";

export default class CustomConsole {
  constructor(public logger = console) {}

  info(message: string) {
    this.logger.log(logSymbols.info, message);
  }

  important(message: string) {
    this.logger.info(logSymbols.info, message);
  }

  error(err: string | Error) {
    this.logger.error(logSymbols.error, err);
  }

  success(message: string) {
    this.logger.log(logSymbols.success, message);
  }

  warn(message: string) {
    this.logger.warn(logSymbols.warning, message);
  }
}


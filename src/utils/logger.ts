import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  static warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static log(message: string): void {
    console.log(message);
  }

  static table(data: any): void {
    console.table(data);
  }

  static spinner(text: string): Ora {
    return ora(text).start();
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  }
}
/** MiaoMiaoJi (Paperang P1) printer configuration */

export interface MiaoMiaoJiConfig {
  /** Serial port path, e.g. "/dev/tty.MiaoMiaoJi-SerialPort" */
  port: string;
  /** Print density 0-100, default 50 */
  density?: number;
  /** Paper feed after print in dots, default 300 */
  feedDots?: number;
}

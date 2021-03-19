import { LogsGlobal } from '@vidyard/browser-logs'
import { RumGlobal } from '@vidyard/browser-rum'

declare global {
  interface Window {
    DD_LOGS?: LogsGlobal
    DD_RUM?: RumGlobal
  }
}

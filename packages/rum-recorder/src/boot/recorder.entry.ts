import { defineGlobal, getGlobalObject } from '@vidyard/browser-core'
import { RumPublicApi, startRum } from '@vidyard/browser-rum-core'

import { startRecording } from './recorder'
import { makeRumRecorderPublicApi } from './rumRecorderPublicApi'

export const datadogRum = makeRumRecorderPublicApi(startRum, startRecording)

interface BrowserWindow extends Window {
  DD_RUM?: RumPublicApi
}
defineGlobal(getGlobalObject<BrowserWindow>(), 'DD_RUM', datadogRum)

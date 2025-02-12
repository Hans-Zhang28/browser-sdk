import { BuildEnv, BuildMode, Datacenter } from '@vidyard/browser-core'

export const buildEnv: BuildEnv = {
  buildMode: '<<< BUILD_MODE >>>' as BuildMode,
  datacenter: '<<< TARGET_DATACENTER >>>' as Datacenter,
  sdkVersion: '<<< SDK_VERSION >>>',
}

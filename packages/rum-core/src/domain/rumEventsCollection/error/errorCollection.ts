import {
  computeStackTrace,
  Configuration,
  Context,
  formatUnknownError,
  getTimeStamp,
  Observable,
  RawError,
  RelativeTime,
  startAutomaticErrorCollection,
} from '@vidyard/browser-core'
import { CommonContext, RawRumErrorEvent, RumEventType } from '../../../rawRumEvent.types'
import { LifeCycle, LifeCycleEventType } from '../../lifeCycle'

export interface ProvidedError {
  startTime: RelativeTime
  error: unknown
  context?: Context
  source: ProvidedSource
}

export type ProvidedSource = 'custom' | 'network' | 'source'

export function startErrorCollection(lifeCycle: LifeCycle, configuration: Configuration) {
  return doStartErrorCollection(lifeCycle, startAutomaticErrorCollection(configuration))
}

export function doStartErrorCollection(lifeCycle: LifeCycle, observable: Observable<RawError>) {
  observable.subscribe((error) => lifeCycle.notify(LifeCycleEventType.RAW_RUM_EVENT_COLLECTED, processError(error)))

  return {
    addError: (
      { error, startTime, context: customerContext, source }: ProvidedError,
      savedCommonContext?: CommonContext
    ) => {
      const rawError = computeRawError(error, startTime, source)
      lifeCycle.notify(LifeCycleEventType.RAW_RUM_EVENT_COLLECTED, {
        customerContext,
        savedCommonContext,
        ...processError(rawError),
      })
    },
  }
}

function computeRawError(error: unknown, startTime: RelativeTime, source: ProvidedSource): RawError {
  const stackTrace = error instanceof Error ? computeStackTrace(error) : undefined
  return { startTime, source, ...formatUnknownError(stackTrace, error, 'Provided') }
}

function processError(error: RawError) {
  const rawRumEvent: RawRumErrorEvent = {
    date: getTimeStamp(error.startTime),
    error: {
      message: error.message,
      resource: error.resource
        ? {
            method: error.resource.method,
            status_code: error.resource.statusCode,
            url: error.resource.url,
          }
        : undefined,
      source: error.source,
      stack: error.stack,
      type: error.type,
    },
    type: RumEventType.ERROR as const,
  }

  return {
    rawRumEvent,
    startTime: error.startTime,
  }
}

import {
  createNewEvent,
  DOM_EVENT,
  Duration,
  RelativeTime,
  restorePageVisibility,
  setPageVisibility,
} from '@vidyard/browser-core'
import { setup, TestSetupBuilder } from '../../../../test/specHelper'
import {
  RumFirstInputTiming,
  RumLargestContentfulPaintTiming,
  RumPerformanceNavigationTiming,
  RumPerformancePaintTiming,
} from '../../../browser/performanceCollection'
import { LifeCycleEventType } from '../../lifeCycle'
import { resetFirstHidden } from './trackFirstHidden'
import {
  Timings,
  trackFirstContentfulPaint,
  trackFirstInputTimings,
  trackLargestContentfulPaint,
  trackNavigationTimings,
  trackTimings,
} from './trackTimings'

const FAKE_PAINT_ENTRY: RumPerformancePaintTiming = {
  entryType: 'paint',
  name: 'first-contentful-paint',
  startTime: 123 as RelativeTime,
}

const FAKE_NAVIGATION_ENTRY: RumPerformanceNavigationTiming = {
  domComplete: 456 as RelativeTime,
  domContentLoadedEventEnd: 345 as RelativeTime,
  domInteractive: 234 as RelativeTime,
  entryType: 'navigation',
  loadEventEnd: 567 as RelativeTime,
}

const FAKE_LARGEST_CONTENTFUL_PAINT_ENTRY: RumLargestContentfulPaintTiming = {
  entryType: 'largest-contentful-paint',
  startTime: 789 as RelativeTime,
}

const FAKE_FIRST_INPUT_ENTRY: RumFirstInputTiming = {
  entryType: 'first-input',
  processingStart: 1100 as RelativeTime,
  startTime: 1000 as RelativeTime,
  name: 'fake',
}

describe('trackTimings', () => {
  let setupBuilder: TestSetupBuilder
  let timingsCallback: jasmine.Spy<(value: Partial<Timings>) => void>

  beforeEach(() => {
    timingsCallback = jasmine.createSpy()
    setupBuilder = setup().beforeBuild(({ lifeCycle }) => trackTimings(lifeCycle, timingsCallback))
  })

  afterEach(() => {
    setupBuilder.cleanup()
  })

  it('should merge timings from various sources', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_NAVIGATION_ENTRY)
    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_PAINT_ENTRY)
    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_FIRST_INPUT_ENTRY)

    expect(timingsCallback).toHaveBeenCalledTimes(3)
    expect(timingsCallback.calls.mostRecent().args[0]).toEqual({
      domComplete: 456 as Duration,
      domContentLoaded: 345 as Duration,
      domInteractive: 234 as Duration,
      firstContentfulPaint: 123 as Duration,
      firstInputDelay: 100 as Duration,
      firstInputTime: 1000 as Duration,
      loadEvent: 567 as Duration,
    })
  })
})

describe('trackNavigationTimings', () => {
  let setupBuilder: TestSetupBuilder
  let navigationTimingsCallback: jasmine.Spy<(value: Partial<Timings>) => void>

  beforeEach(() => {
    navigationTimingsCallback = jasmine.createSpy()
    setupBuilder = setup().beforeBuild(({ lifeCycle }) => trackNavigationTimings(lifeCycle, navigationTimingsCallback))
  })

  afterEach(() => {
    setupBuilder.cleanup()
  })

  it('should provide the first contentful paint timing', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_NAVIGATION_ENTRY)

    expect(navigationTimingsCallback).toHaveBeenCalledTimes(1)
    expect(navigationTimingsCallback).toHaveBeenCalledWith({
      domComplete: 456 as Duration,
      domContentLoaded: 345 as Duration,
      domInteractive: 234 as Duration,
      loadEvent: 567 as Duration,
    })
  })
})

describe('trackFirstContentfulPaint', () => {
  let setupBuilder: TestSetupBuilder
  let fcpCallback: jasmine.Spy<(value: RelativeTime) => void>

  beforeEach(() => {
    fcpCallback = jasmine.createSpy()
    setupBuilder = setup().beforeBuild(({ lifeCycle }) => trackFirstContentfulPaint(lifeCycle, fcpCallback))
    resetFirstHidden()
  })

  afterEach(() => {
    setupBuilder.cleanup()
    restorePageVisibility()
    resetFirstHidden()
  })

  it('should provide the first contentful paint timing', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_PAINT_ENTRY)

    expect(fcpCallback).toHaveBeenCalledTimes(1 as RelativeTime)
    expect(fcpCallback).toHaveBeenCalledWith(123 as RelativeTime)
  })

  it('should not set the first contentful paint if the page is hidden', () => {
    setPageVisibility('hidden')
    const { lifeCycle } = setupBuilder.build()
    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_PAINT_ENTRY)
    expect(fcpCallback).not.toHaveBeenCalled()
  })
})

describe('largestContentfulPaint', () => {
  let setupBuilder: TestSetupBuilder
  let lcpCallback: jasmine.Spy<(value: RelativeTime) => void>
  let emitter: Element

  beforeEach(() => {
    lcpCallback = jasmine.createSpy()
    emitter = document.createElement('div')
    setupBuilder = setup().beforeBuild(({ lifeCycle }) => trackLargestContentfulPaint(lifeCycle, emitter, lcpCallback))
    resetFirstHidden()
  })

  afterEach(() => {
    setupBuilder.cleanup()
    restorePageVisibility()
    resetFirstHidden()
  })

  it('should provide the largest contentful paint timing', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_LARGEST_CONTENTFUL_PAINT_ENTRY)
    expect(lcpCallback).toHaveBeenCalledTimes(1 as RelativeTime)
    expect(lcpCallback).toHaveBeenCalledWith(789 as RelativeTime)
  })

  it('should not be present if it happens after a user interaction', () => {
    const { lifeCycle } = setupBuilder.build()

    emitter.dispatchEvent(createNewEvent(DOM_EVENT.KEY_DOWN, { timeStamp: 1 }))

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_LARGEST_CONTENTFUL_PAINT_ENTRY)
    expect(lcpCallback).not.toHaveBeenCalled()
  })

  it('should not be present if the page is hidden', () => {
    setPageVisibility('hidden')
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_LARGEST_CONTENTFUL_PAINT_ENTRY)

    expect(lcpCallback).not.toHaveBeenCalled()
  })
})

describe('firstInputTimings', () => {
  let setupBuilder: TestSetupBuilder
  let fitCallback: jasmine.Spy<
    ({ firstInputDelay, firstInputTime }: { firstInputDelay: number; firstInputTime: number }) => void
  >

  beforeEach(() => {
    fitCallback = jasmine.createSpy()
    setupBuilder = setup().beforeBuild(({ lifeCycle }) => trackFirstInputTimings(lifeCycle, fitCallback))
    resetFirstHidden()
  })

  afterEach(() => {
    setupBuilder.cleanup()
    restorePageVisibility()
    resetFirstHidden()
  })

  it('should provide the first input timings', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_FIRST_INPUT_ENTRY)
    expect(fitCallback).toHaveBeenCalledTimes(1)
    expect(fitCallback).toHaveBeenCalledWith({ firstInputDelay: 100, firstInputTime: 1000 })
  })

  it('should not be present if the page is hidden', () => {
    setPageVisibility('hidden')
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, FAKE_FIRST_INPUT_ENTRY)

    expect(fitCallback).not.toHaveBeenCalled()
  })

  it('should not be present if the first-input performance entry is invalid', () => {
    const { lifeCycle } = setupBuilder.build()

    lifeCycle.notify(LifeCycleEventType.PERFORMANCE_ENTRY_COLLECTED, {
      entryType: 'first-input' as const,
      // Invalid, because processingStart should be >= startTime
      processingStart: 900 as RelativeTime,
      startTime: 1000 as RelativeTime,
      name: 'fake',
    })

    expect(fitCallback).not.toHaveBeenCalled()
  })
})

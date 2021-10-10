import Fighter from '../../common/engine/Fighter';

/**
 * @enum
 * @summary The type of callout, determines sound-byte used
 */
enum CalloutType {
  Title,
  Name,
  Kill,
  BuildTension,
  MustHurt,
  Ouch,
  Surprise,
}

/**
 * @enum
 * @summary Determines how important a message is. Higher priority messages will force lower-priority ones out of queue.
 */
enum CalloutPriority {
  Low,
  Medium,
  High,
  Immediate,
}

/**
 * @class AnnouncerEvent
 * @summary Data struct for holding information about announcer callouts
 */
class AnnouncerEvent {
  /**
   * @constructor
   * @param {CalloutType} type Type of callout this is
   * @param {Fighter} instigator Figher that caused the callout
   * @param {CalloutPriority} priority Priority of message
   * @param {number} staleTimer Time in seconds until the callout becomes irrelevant
   * @param {number} padding Additional time after sound byte to wait before next item in queue
   */
  constructor(
    public type: CalloutType,
    public instigator: Fighter,
    public priority: CalloutPriority = CalloutPriority.Low,
    public staleTimer: number = 5,
    public padding: number = 0,
  ) { }
}

export { CalloutType, CalloutPriority, AnnouncerEvent };
import * as events from '../events/events';

/**
 * Decodes the provided envelope into its concrete type
 */
function decoder(envelope: events.core.Envelope): any {
  switch (envelope.type) {
    case events.core.TypeEnum.LobbyRequest:
      return events.lobby.LobbyRequest.decode(envelope.data);
    case events.core.TypeEnum.LobbyResponse:
      return events.lobby.LobbyResponse.decode(envelope.data);
    default:
      // TODO: Figure out how to make this an exhaustive switch
      // and produce a compile error if not all cases are covered.
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
      return null as never;
  }
}

export { decoder as default };

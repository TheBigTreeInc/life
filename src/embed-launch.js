(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LifeEmbedLaunch = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const SCHEMA = 'life.embed-launch/v1';
  const MATCH_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

  // An opaque match selector is not a login grant or authorization. The Life
  // backend must authenticate and authorize every future match operation.
  function parse(url, embedded) {
    const parsed = new URL(String(url));
    const matches = parsed.searchParams.getAll('match');
    const requested = matches.length !== 0;
    const valid = matches.length <= 1 && (!requested || MATCH_ID.test(matches[0]));
    return Object.freeze({
      schema: SCHEMA,
      embedded: Boolean(embedded),
      matchRequested: requested,
      matchId: valid && requested ? matches[0] : null,
      invalidMatch: !valid,
      // Intentionally no token, account, actor, URL, Social grant, or room secret.
    });
  }
  function fromWindow(view) {
    let embedded = false;
    try { embedded = view.self !== view.top; } catch (_) { embedded = true; }
    return parse(view.location.href, embedded);
  }
  return Object.freeze({ SCHEMA, parse, fromWindow });
});

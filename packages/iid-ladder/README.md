# @0xintuition/iid-ladder

Shared identifier-projection ladder for application, seed, and import pipelines.

The ladder selects the first canonical identity available in this order:

1. a registered strong identifier;
2. a provider handle that maps to a registered IID scheme;
3. a canonical URL;
4. an explicit envelope fallback.

```ts
import { projectIdentifierLadder } from '@0xintuition/iid-ladder';

projectIdentifierLadder({
	strongIdentifiers: { isrc: 'USUM71703861' },
	providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
	canonicalUrl: 'https://open.spotify.com/track/1kcfGBb6kSrGqNIMW7rAlB',
});
// { iid: 'int:isrc:USUM71703861', rung: 'strong' }
```

Strong inputs must already be canonical. Registered provider translations use
the frozen canonicalizer for their target scheme. Provider-local namespaces
such as `spotify:*` are audited, but are **not** emitted as `int:` identifiers
until their schemes are ratified in `@0xintuition/iid-spec`. This is an
intentional safety difference from the first private implementation, which
could produce IID-shaped values that the public parser rejected.

The package is pure and offline. It performs no classification, network I/O,
provider enrichment, contract calls, or atom serialization.

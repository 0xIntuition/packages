# `url` — Web Resource URL

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | polymorphic (a URL may address any kind of resource — an article, a person's homepage, a product, a video) |
| Natural key | The resource's address |
| Canonical form | `https://<host>[:<port>]<path>[?<sorted-query>]` |

## What it identifies

A web resource, identified by the address at which it is served. The address *is* the identity: two fetches of the same canonical URL are claims about the same resource. Because a URL can address anything, the scheme is polymorphic — an `int:url:` atom floors at profile P1, with `@type` carried in the payload ([§7](../spec/07-representation-profiles.md)).

This is scheme version **v0.2** (decision D17). Per tenet 5, these rules are frozen; a rule change ships as a new scheme name.

## Value grammar

The value is an absolute `http` or `https` URL, parseable under the WHATWG URL standard. After canonicalization it always begins `https://`. The full IID is `int:url:https://…` — the value contains colons and slashes, and a parser MUST split only on the first two colons ([§2.3](../spec/02-grammar.md)).

## Canonicalization

1. Trim surrounding whitespace and parse as a WHATWG URL. Reject if unparseable.
2. Reject any scheme other than `http` or `https`. `http` is folded to `https`; nothing else is folded — `ftp:`, `ipfs:`, `mailto:` etc. are rejections, not near-misses.
3. Lowercase the hostname and strip one leading `www.`.
4. Drop the port if it is `80` or `443` (the defaults for the two accepted schemes). **Any other explicit port is kept** — `https://example.com:8443/x` and `https://example.com/x` are different origins and stay different identifiers.
5. Drop the fragment entirely. A fragment is client-side state, not a distinct resource.
6. Drop every query parameter whose key matches the frozen tracking-parameter pattern:
   - prefix match: any key beginning `utm_`
   - exact match: `fbclid`, `gclid`, `dclid`, `wbraid`, `gbraid`, `msclkid`, `twclid`, `ttclid`, `igshid`, `g_mp`, `spm`, `mkt_tok`, `mc_cid`, `ref`, `si`

   These are ad-platform click IDs, share/session tags, and marketing-automation tokens — values that vary per visitor while addressing the same resource.
7. Sort the remaining parameters by key, then by value (code-point order), and re-encode each key and value with `encodeURIComponent`, joined as `k=v&k=v`. Sorting plus uniform re-encoding gives one byte sequence regardless of the order or escaping the source used.
8. Strip all trailing slashes from the path (`/path/` → `/path`; `/` → empty).
9. Reassemble: `https://` + host + port (if kept) + path + `?` + query (omitted when no parameters remain).

Path case is **preserved**. Many servers treat paths case-sensitively (`/wiki/Brad_Pitt`), so folding it would merge distinct resources.

### Enrichment boundary

Resolving HTTP redirects and reading a page's `<link rel="canonical">` are legitimate and encouraged — and they are **enrichment**, performed *before* canonicalization to produce a better input. They MUST NOT happen inside canonicalization, which is a pure, offline function of its input (tenet 4, [§0.3](../spec/00-overview.md)). A conforming canonicalizer never touches the network.

### Freeze constraint

Per decision D12, canonicalization is frozen at first mint. The tracking-parameter list above is part of the frozen rules: additions had to land before any `int:url:` atom existed, and none can land now. A newly invented tracking parameter that slips through produces a non-preferred duplicate, which the equivalence layer resolves — the frozen rule stays frozen.

## Validation

A value is canonical iff canonicalizing it returns it unchanged: `https` scheme, no `www.` prefix, no default port, no fragment, no tracking parameters, query sorted and uniformly encoded, no trailing slash. A validator MUST reject any value where re-canonicalization differs, including bare `http://` inputs and unsorted queries — well-formed but non-canonical values are invalid ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `http://www.Example.com:80/path/?utm_source=x&b=2&a=1#frag` | `https://example.com/path?a=1&b=2` | folds scheme, strips www/port/fragment/tracking, sorts query, trims trailing slash |
| `https://en.wikipedia.org/wiki/Brad_Pitt` | `https://en.wikipedia.org/wiki/Brad_Pitt` | path case is preserved |
| `https://example.com/` | `https://example.com` | root trailing slash strips |
| `ftp://example.com/file` | ✗ reject | non-http(s) scheme |
| `not a url` | ✗ reject | unparseable |

## Notes and limitations

- **A URL identifies an address, not content.** The page behind an address can change or vanish; two addresses can serve identical content. Content identity is the [`hash`](./hash.md) scheme's job; sameness across addresses is an equivalence claim.
- **Userinfo is dropped.** Credentials embedded in a URL (`https://user:pass@host/`) do not survive canonicalization — they are access material, not identity.
- Only one leading `www.` is stripped; `www2.` and other subdomains are preserved, as distinct hosts are presumed distinct resources.
- The tracking-parameter list is a pragmatic, frozen snapshot, not an exhaustive taxonomy. `ref` and `si` in particular are stripped even though a minority of sites use them as content-significant parameters; D17 judged the deduplication win worth the edge cases.
- In an identity ladder, `url` outranks every `gen1` hash and ranks below all Class A registry identifiers ([§3.5](../spec/03-identity-classes.md)).

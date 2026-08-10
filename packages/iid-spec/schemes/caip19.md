# `caip19` — CAIP-19 On-Chain Asset

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (an on-chain asset) |
| Natural key | An on-chain asset's chain + contract |
| Canonical form | `<namespace>:<reference>/<asset_namespace>:<asset_reference>` per [CAIP-19](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md) |

## What it identifies

An on-chain asset — a fungible token, an NFT collection, a native coin — identified by the chain it lives on plus its contract or asset reference. The scoping is intrinsic and passes the litmus test of [§5.5.1](../spec/05-identity-ladders.md): token `0xa0b8…` is meaningless without knowing its chain.

The scheme is unambiguously typed — a CAIP-19 value is always an on-chain asset — so it is eligible for P0 anchoring ([§7](../spec/07-representation-profiles.md)). Contrast [`caip10`](./caip10.md), which names the account or contract itself rather than the asset it manages.

## Value grammar

A CAIP-19 asset type: a chain ID and an asset ID joined by a slash.

```text
namespace : reference / asset_namespace : asset_reference
[-a-z0-9]{3,8}  [-_a-zA-Z0-9]{1,32}  [-a-z0-9]{3,8}  one or more characters
```

The value contains both colons and a slash. A parser MUST split the IID on the first two colons only and treat `eip155:1/erc20:0xa0b8…` as one opaque value ([§2.3](../spec/02-grammar.md)):

```text
int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48    (USDC)
int:caip19:eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d   (BAYC)
```

## Canonicalization

1. Trim surrounding whitespace.
2. Match against the four-segment shape above — the slash between reference and asset namespace is mandatory. Reject on no match.
3. If the chain namespace is `eip155` **and** the asset reference matches `0x` + exactly 40 hex characters (a 20-byte contract address): lowercase the asset reference.
4. Otherwise pass all four segments through **unmodified**.

The lowercase rule exists for the same reason as in [`caip10`](./caip10.md): EIP-55 mixed case is a presentation checksum over the same underlying bytes, and byte-exact comparison ([§2.4](../spec/02-grammar.md)) permits exactly one canonical case form.

### Scheme vs. registry

The canonicalizer accepts **any** well-formed asset namespace — `erc20`, `erc721`, `erc1155`, `slip44`, and whatever CAIP namespaces come next. Which asset namespaces a deployment actually *classifies* and mints atoms for is a registry and ladder concern, decided per entity type — it is deliberately not baked into the scheme, so the frozen canonicalization (tenet 5) never needs editing when coverage expands.

## Validation

A value is canonical iff canonicalizing it returns it unchanged. For an `eip155` asset with a 20-byte hex reference, that means all-lowercase hex; a checksummed reference is well-formed but not valid and MUST be rejected ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | `eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | erc20 asset reference lowercases |
| `eip155:1/erc721:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D` | `eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d` | erc721 canonicalizes; classification narrowing is a registry concern |
| `eip155:1:erc20:0xA0b8` | ✗ reject | missing slash separator |

## Notes and limitations

- **Hex folding applies only to bare 20-byte references.** An asset reference that is not exactly `0x` + 40 hex — a `slip44` coin type (`eip155:1/slip44:60`), or a CAIP-19 token-ID form whose reference carries a `/tokenId` suffix — passes through with its case preserved. Writers of such values are responsible for supplying them in a consistent form; variants are bridged by equivalence.
- Non-`eip155` chain namespaces receive no per-namespace validation or folding, mirroring the leniency documented in [`caip10`](./caip10.md). The rules are frozen with the scheme.
- The same token contract bridged to another chain yields a distinct identifier, by design. "Same asset on another chain" is an equivalence claim layered above ([§8](../spec/08-equivalence.md)).
- A `caip19` value identifies the asset (the collection or token contract), the natural on-chain analogue of the *package, not release* rule ([§5.5](../spec/05-identity-ladders.md)).

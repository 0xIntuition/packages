# `caip10` — CAIP-10 Blockchain Account

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | polymorphic (an address is an externally-owned account **or** a deployed contract; the chain cannot be told apart from the string) |
| Natural key | A blockchain account or contract address, scoped by its chain |
| Canonical form | `<namespace>:<reference>:<address>` per [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) |

## What it identifies

An on-chain account: an externally-owned account or a smart contract, on a specific chain. The identity is intrinsic — an Ethereum address is derived from the keypair or deployment that produced it; no registry assigns it and none could revoke it.

The chain scope in the value passes the scoped-identifier litmus test ([§5.5.1](../spec/05-identity-ladders.md)): address `0xd8da…` is meaningless without knowing which chain it lives on, so the chain belongs in the identifier.

Because the same string may name a wallet or a contract, the scheme is polymorphic: an `int:caip10:` atom floors at profile P1, with `@type` in the payload ([§7](../spec/07-representation-profiles.md)).

## Value grammar

The CAIP-10 account ID, three colon-separated segments:

```text
namespace : reference : address
[-a-z0-9]{3,8}   [-_a-zA-Z0-9]{1,32}   one or more characters
```

```text
int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045
int:caip10:cosmos:cosmoshub-4:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0
```

The canonical value itself contains colons — `int:caip10:eip155:1:0xd8da…` has four colons total. A parser MUST split the IID on the **first two colons only** and treat everything after as one opaque value ([§2.3](../spec/02-grammar.md)); splitting on all colons is the single most common implementation error against this specification.

## Canonicalization

1. Trim surrounding whitespace.
2. Match against the three-segment CAIP-10 shape above. Reject on no match (including a missing segment or an uppercase namespace).
3. If the namespace is `eip155`:
   1. The address MUST match `0x` followed by exactly 40 hex characters (a 20-byte address). Reject otherwise.
   2. Lowercase the address.
4. For any other namespace, pass namespace, reference, and address through **unmodified**.

### Why lowercase, not EIP-55

EIP-55 mixed-case checksumming is a *presentation* convention: the case pattern encodes a checksum of the all-lowercase address, and every case variant denotes the same account. The identifier layer's comparison rule is byte equality with no folding ([§2.4](../spec/02-grammar.md)), so exactly one case form can be canonical — and it must be the case-free one, or two correct writers producing `0xd8dA…` and `0xd8da…` would mint different identifiers for the same account. Checksums protect transcription at the UI layer; identity lives below it.

## Validation

A value is canonical iff canonicalizing it returns it unchanged. For `eip155` this means a well-formed 20-byte address in all-lowercase hex; a checksummed (mixed-case) address is well-formed but **not valid** as an IID value and MUST be rejected by a validator ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` | `eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045` | eip155 address lowercases (no EIP-55 at the ID layer) |
| `cosmos:cosmoshub-4:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0` | `cosmos:cosmoshub-4:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0` | non-eip155 namespaces pass through |
| `eip155:1:0xd8da6bf2` | ✗ reject | eip155 address must be 20 bytes |

## Notes and limitations

- **Non-eip155 leniency.** Only the `eip155` namespace gets per-namespace validation and case folding. Every other namespace (`cosmos`, `solana`, `bip122`, …) is passed through verbatim after the shape check: no address-format validation, no case folding. For case-sensitive address encodings (base58, bech32) pass-through is correct; for any future namespace whose addresses are case-insensitive, two case variants of the same account would yield distinct identifiers until bridged by equivalence. Per-namespace rules are frozen with the scheme (tenet 5) and cannot be retrofitted.
- The same address deployed on two chains yields two distinct identifiers, by design — a contract on mainnet and its twin on an L2 are different on-chain objects. Sameness across chains is an equivalence claim, not identity.
- `caip10` names the account itself. An on-chain *asset* managed by a contract is the [`caip19`](./caip19.md) scheme's territory.

# What is an Intuition ID?

*A ten-minute introduction. No code, no cryptography, no prior knowledge assumed.*

---

## The problem: the same thing, named a thousand ways

Suppose three people independently add the band Radiohead to a shared knowledge base.

The first types `Radiohead`. The second, importing from a music database, adds `Radiohead` with a note that it is a British rock band. The third, scraping a festival lineup, gets `RADIOHEAD`. A fourth imports from a European catalogue and gets `Radiohead ` — with a trailing space nobody can see.

You now have four entries for one band. Every fact anyone contributes attaches to one of the four at random. Ratings split. Followers split. Search returns four results and the user picks one, arbitrarily. The knowledge base knows less than any single contributor did.

This is not a rare edge case. It is the default outcome of letting many independent parties describe the same world. **Any system that accepts contributions from more than one source has this problem, and it compounds with every new source.**

## Why the obvious fixes don't work

**"Give everything an ID number."** Whose? An ID number only helps if everyone gets it from the same place. That means a central registry — an organization that hands out numbers, that you must ask permission from, that can go away, and that becomes the single point everyone must trust. Intuition is a decentralized protocol. There is no one to ask.

**"Just match on the name."** Names are not unique. There are at least four bands called Nirvana. There are millions of people called John Smith. There are two films called *Dune*, thirty-seven years apart. Name-matching merges things that are genuinely different, which is worse than splitting things that are the same — you can separate a bad merge only by knowing what was merged.

**"Use fuzzy matching / AI to figure it out."** These are useful, but they are guesses, and guesses are not reproducible. Two systems running two different matchers get two different answers, and now you have a disagreement about disagreements. Something further down has to be deterministic or the whole thing floats.

## The idea: derive the name from the thing

An **Intuition ID** — IID for short — is an identifier you *compute* rather than *request*.

You take the facts you have about a thing, run them through a published, exactly-specified procedure, and out comes a string. Anyone else with the same facts, running the same procedure, gets the same string. No registry, no permission, no coordination.

Every IID looks like this:

```text
int:isbn:9780684832722
 ↑    ↑        ↑
 |    |        the value
 |    which kind of identifier this is
 always "int" — this is an Intuition ID
```

Some examples of real ones:

| IID | What it names |
| :-- | :-- |
| `int:isbn:9780684832722` | A specific edition of a specific book |
| `int:wd:Q25188` | The film *Inception* |
| `int:isni:0000000121032683` | The band Daft Punk |
| `int:url:https://en.wikipedia.org/wiki/Brad_Pitt` | A particular web page |
| `int:caip10:eip155:1:0xd8da6bf2…` | An Ethereum account |
| `int:geo:9q8yyk8y` | A ~40-metre square of the Earth's surface |

Now the four Radiohead entries all compute to `int:isni:0000000123471985`, and the system can see they are one band.

## The trap that makes this hard

Here is the thing that sounds clever and is actually the central danger:

> "We'll just hash the name. Hashing produces a unique fixed-length string, so we get unique IDs."

Hashing does not create uniqueness. **Hashing preserves whatever uniqueness the input already had.** If you hash the name "Nirvana", you get a fixed-length string that is shared by every band called Nirvana — exactly as ambiguous as the name was, but now unreadable, so the ambiguity is hidden instead of obvious.

This is the single most important idea in the specification:

> **The quality of a derived identifier equals the quality of the facts it was derived from.**

You cannot compute your way out of not knowing which Nirvana you meant. So the specification does not try. Instead, it does something more useful: it **ranks the facts**.

## Three strengths of identifier

Every kind of identifier belongs to one of three classes, and the class tells you honestly how much the identifier is worth.

### Class A — a registry already did the work

Some things already have real, globally unique identifiers, assigned by an organization whose entire job is making sure no two things get the same one. Books have ISBNs. Recordings have ISRCs. Companies have LEIs. Researchers have ORCIDs. Films have EIDRs.

When such an identifier exists, we use it. We are not inventing identity; we are **borrowing authority** from an institution that already established it. These identifiers are unique by construction — the registry guarantees it.

`int:isbn:9780684832722` is a Class A identifier. There is exactly one book edition on Earth with that ISBN.

### Class B — the thing carries its own identity

Some things don't need a registry because they are already unique by their nature.

A web page is identified by its URL. An Ethereum account is identified by its address — there is no registry of Ethereum accounts, and none is needed, because the address *is* the account. An image file is identified by a fingerprint of its exact bytes: change one pixel and it is a different file, provably.

These are **natural keys**. Nobody assigned them; they fall out of what the thing is.

`int:caip10:eip155:1:0xd8da6bf2…` is a Class B identifier. That address is that account, definitionally.

### Class C — we hash what little we know, and we say so

Then there is everything else. A band with no ISNI. A local restaurant. A concept. A person who is not a published researcher.

Here there is no authority and no natural key, so we take a small, carefully chosen set of facts and compute an identifier from them. This is a real identifier and it is genuinely useful — but it is weak, and **the specification is explicit that it is weak.**

`int:gen1:music-group:r4:8f3c…` is a Class C identifier derived from the name "Nirvana". It does not identify a band. It identifies *the name-level concept "Nirvana" as a music group* — which is honestly all the person who created it knew.

**Two different bands called Nirvana will get the same Class C identifier, and that is correct behaviour.** The system has not made an error; it has accurately recorded that, on the evidence available, these were indistinguishable. Recording an honest ambiguity is far better than inventing a false distinction. Later, when someone contributes an ISNI, the ambiguity resolves — through the mechanism described below.

The class is visible in the identifier itself. Anyone reading `int:gen1:…` can see at a glance that this is a weak claim, and any product surface can display it accordingly.

## The ladder: always use the best you have

Each type of entity has an ordered list of identifier options, strongest first. It's called an **identity ladder**.

For a film, the ladder is roughly:

```text
1.  Wikidata ID          ← open, freely licensed data. Best.
2.  EIDR                 ← the film industry's own registry
3.  TMDB ID              ← community registry, open data exports
4.  IMDb ID              ← works, but proprietary and closed
5.  name + release year  ← derived. Weak.
6.  name alone           ← derived. Weakest.
```

You climb as high as your facts allow, and mint from that rung. If you know the Wikidata ID, you use it. If all you have is "Inception, 2010", you use rung 5 and the identifier openly says so.

Notice rung 3 sits above rung 4. TMDB and IMDb both work technically, but TMDB publishes open data exports and IMDb does not. **When two identifiers are equally correct, the specification prefers the more open one** — because an identifier nobody outside one company can verify is a weaker foundation for a public knowledge graph, regardless of how well it functions today.

## Identifiers don't finish the job — claims do

Here is where people usually expect the story to end, and where it actually gets interesting.

Suppose one contributor creates a Nirvana entry from a Wikidata ID, and another creates one from an ISNI. Both are Class A. Both are correct. And they are **different strings**, so the system sees two entries.

Deterministic identifiers cannot solve this alone, and the specification does not pretend otherwise. Instead, identifiers do the job they are actually good at — collapsing the easy, high-volume duplicates automatically — and a second layer handles the rest:

**An equivalence claim.** Someone asserts "this entry and that entry are the same thing." That assertion is itself a piece of content in the knowledge graph. It can be agreed with, disputed, and staked on, exactly like any other claim in Intuition. Enough agreement and the two entries are treated as one, with the strongest identifier elected to represent the cluster.

This is the correct division of labour:

- **Identifiers** are mechanical, deterministic, and free. They handle the overwhelming majority of duplicates with no human involvement.
- **Claims** are social, contestable, and carry economic weight. They handle the judgement calls — which are exactly the cases where a machine guessing quietly would be a liability.

The specification is emphatic on this point:

> **An IID is a claim of identity, not a certificate.**

Anyone can create an entry carrying any identifier. Nothing stops someone attaching the wrong ISBN to the wrong book. Correctness is not enforced by the identifier — it is established the same way every other truth claim in Intuition is established: by attestation, by stake, by people putting something behind it.

## Why this matters

Once identity is deterministic, several things that are normally hard become easy:

**Contributions accumulate instead of scattering.** Ten thousand people adding facts about *The Great Gatsby* all attach them to the same entry, because they all computed the same identifier without ever coordinating.

**Anyone can join without asking.** A new application does not need to sync a mapping table or request IDs from Intuition. It computes identifiers from the published spec and its data lands in the right place. This is the difference between an open protocol and a platform with an API.

**Data from different worlds connects.** A book, its author, that author's Ethereum account, a podcast episode where the book is discussed, and the web page reviewing it are five entries derived by five completely different rules — and they interconnect, because they share one identifier space.

**The confidence is legible.** Every identifier carries its own strength on its face. A product can show that this entry is registry-backed and that one is a best guess. Most systems bury this distinction; this one publishes it.

## What an Intuition ID is not

Being precise about the boundaries matters as much as the capabilities:

- **Not a proof that anything is true.** It says "someone computed this identifier from these facts," not "these facts are correct."
- **Not a guarantee of uniqueness for Class C.** Class C identifiers are ambiguous by design and openly labelled as such.
- **Not a permanent record of everything known.** An identifier fixes identity at creation. Everything learned afterwards — descriptions, images, relationships, corrections — lives in claims around it, not inside it.
- **Not a replacement for human judgement.** It removes the mechanical work so that judgement can be spent where it is actually needed.

## Where to go next

- The full rules: [the specification](./spec/00-overview.md), starting with the overview.
- The exact rules for any one identifier type: [the scheme registry](./schemes/README.md).
- The working code: [`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid).

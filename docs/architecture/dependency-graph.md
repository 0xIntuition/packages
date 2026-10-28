# Runtime dependency graph

Arrows point from each package to its runtime dependency. External contract artifacts are checked by the release gates.

```mermaid
graph TD
  atom-classification --> atom-enrichment
  atom-classification --> atom-parser
  atom-classification --> classifications
  atom-classification --> iid
  atom-classification --> iid-ladder
  atom-classification --> iid-registry
  atom-classification --> pipeline-runtime
  atom-classification --> predicates
  atom-classification --> primitives
  atom-classification --> schema-org
  atom-enrichment --> classifications
  atom-enrichment --> iid
  atom-enrichment --> iid-ladder
  atom-enrichment --> iid-registry
  atom-enrichment --> pipeline-runtime
  atom-enrichment --> protocol
  atom-enrichment --> schema-org
  atom-parser --> iid
  atom-runtime --> atom-classification
  atom-runtime --> atom-enrichment
  atom-runtime --> atom-parser
  atom-runtime --> iid-registry
  atom-runtime --> pipeline-runtime
  classifications --> iid
  cli --> periphery
  cli --> protocol
  cli --> sdk
  iid-ladder --> iid
  iid-registry --> classifications
  iid-registry --> iid
  periphery --> deployments
  predicates --> ids
  primitives --> classifications
  primitives --> ids
  primitives --> iid
  primitives --> iid-registry
  primitives --> predicates
  protocol --> deployments
  react --> deployments
  react --> ids
  react --> protocol
  sdk --> curves
  sdk --> deployments
  sdk --> ids
  sdk --> periphery
  sdk --> protocol
```

Classification depends on enrichment helpers; enrichment never depends on classification. The composition root depends on both.

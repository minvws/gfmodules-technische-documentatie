---
title: "OAuth-token ophalen"
heading: "🔑 OAuth-token ophalen"
---

OAuth hoort bij de dienst die je wilt aanroepen. PRS en NVI hebben ieder een eigen OAuth 2.0
Authorization Service met een eigen token-endpoint, audience en scopes.

{{% notice title="Kies eerst je doelservice" %}}
Een token van PRS gebruik je uitsluitend voor de PRS; een token van NVI uitsluitend voor de NVI.
De voorbeelden gebruiken mTLS met je PKIoverheid-certificaat.
{{% /notice %}}

{{% service-cards %}}

{{% service-card icon="👤" icon-class="icon-prs" %}}
### PRS

*Pseudoniemendienst*

De PRS-documentatie bevat instructies voor het ophalen van een OAuth-token voor toegang tot de dienst.

[OAuth-instructies voor PRS →](/integration/prs/#oauth-token)
{{% /service-card %}}

{{% service-card icon="📑" icon-class="icon-nvi" %}}
### NVI

*Nationale Verwijs Index*

De NVI-documentatie bevat instructies voor het ophalen van een OAuth-token en het uitvoeren van NVI-operaties.

[OAuth-instructies voor NVI →](/integration/nvi/#oauth-token)
{{% /service-card %}}

{{% /service-cards %}}

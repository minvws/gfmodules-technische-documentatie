---
title: "Integratie"
heading: "Integratie-documentatie"
---

Stap-voor-stap instructies voor het verbinden met de Generieke Functies.

{{% card %}}
### Hoe begin ik?

Begin met de [aansluitinstructies](/integration/aansluiten/).
Voor beide diensten heb je een PKIoverheid-clientcertificaat nodig. Registreer je organisatie en dit certificaat vooraf bij de
beheerder van de betreffende dienst. In de voorbeelden haal je met het certificaat bij het
OAuth-endpoint van de gekozen dienst een token op; met dat token en het certificaat roep je
vervolgens die dienst aan.

{{% columns %}}

{{% column %}}
#### PRS {#aansluitstappen-prs}

1. [Aansluiten](/integration/aansluiten/)
2. [Token via PRS OAuth](/integration/prs/#oauth-token)
3. [PRS](/integration/prs/)
{{% /column %}}

{{% column %}}
#### NVI {#aansluitstappen-nvi}

1. [Aansluiten](/integration/aansluiten/)
2. [Token via NVI OAuth](/integration/nvi/#oauth-token)
3. [NVI](/integration/nvi/)
{{% /column %}}

{{% /columns %}}

{{% /card %}}

{{% service-cards %}}

{{% service-card icon="📜" %}}
### Aansluiten

*Certificaat, registratie en verbinding*

Bereid je aansluiting voor met een PKIoverheid-certificaat, registreer je organisatie en test de verbinding met de PRS of NVI.

[Naar aansluitinstructies →](/integration/aansluiten/)
{{% /service-card %}}

{{% service-card icon="👤" icon-class="icon-prs" %}}
### PRS

*Pseudoniemendienst*

De PRS biedt vier gebruiksmogelijkheden: omkeerbare pseudoniemen, niet-omkeerbare pseudoniemen, DigiD SAML-exchange en geblindeerde OPRF-uitwisseling. De documentatie beschrijft ook OAuth-toegang tot de dienst.

[Naar PRS-documentatie →](/integration/prs/)
{{% /service-card %}}

{{% service-card icon="📑" icon-class="icon-nvi" %}}
### NVI

*Nationale Verwijs Index*

De NVI-documentatie beschrijft het registreren en lokaliseren van gegevensbeschikbaarheid en het ontwerp voor privacybeschermde matching.

[Naar NVI-documentatie →](/integration/nvi/)
{{% /service-card %}}

{{% /service-cards %}}

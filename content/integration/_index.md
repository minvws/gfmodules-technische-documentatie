---
title: "Integratie"
heading: "Integratie-documentatie"
---

Stap-voor-stap instructies voor het verbinden met de Generieke Functies.

{{% card %}}
### Hoe begin ik?

Begin met de [aansluitinstructies](/integration/aansluiten/).
Voor beide diensten heb je een PKIoverheid-clientcertificaat en een geregistreerde client nodig. Registreer je organisatie en client vooraf bij de
beheerder van de betreffende dienst. Je ontvangt een `client_id` en toegang tot de afgesproken scopes. In de voorbeelden haal je met het certificaat bij het
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

De PRS levert omkeerbare en niet-omkeerbare pseudoniemen en geblindeerde OPRF-uitwisseling. De documentatie beschrijft OAuth-toegang, ontvangersleutels, sleutelversies en de afzonderlijk inschakelbare SAML-testkoppeling.

[Naar PRS-documentatie →](/integration/prs/)
{{% /service-card %}}

{{% service-card icon="📑" icon-class="icon-nvi" %}}
### NVI

*Nationale Verwijs Index*

De NVI registreert en lokaliseert gegevensbeschikbaarheid bij zorgaanbieders. De documentatie beschrijft privacybeschermde matching, brongebonden autorisatie en de FHIR- en Core-API.

[Naar NVI-documentatie →](/integration/nvi/)
{{% /service-card %}}

{{% /service-cards %}}

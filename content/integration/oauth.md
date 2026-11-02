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

Vraag een token aan met `grant_type=client_credentials`, de `target_audience` van de doelservice, de gewenste `scope`, je geregistreerde `client_id` en `organization_external_id`. Gebruik als organisatie-identificatie het OIN van 20 posities zonder voorvoegsel voor de PRS en de URA van de zorgaanbieder voor de NVI. Het OIN van de handelende organisatie wordt uit het clientcertificaat bepaald.

Voor NVI-toegang met `nvi:read`, `nvi:create` of `nvi:delete` geef je ook de geregistreerde `source_id` mee. Voor uitsluitend `nvi:localize` is geen bronidentifier nodig. Je kunt meerdere toegestane scopes scheiden met spaties.

De tokenresponse bevat `token_type`, `access_token` en `scope`. Gebruik `access_token` als `Authorization: Bearer <token>` bij de doelservice. De geldigheid staat in de `exp`-claim van het JWT. Er wordt geen refresh token uitgegeven; vraag bij verlopen geldigheid een nieuw token aan.

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

### Metadata en tokenverificatie

De OAuth-services van PRS en NVI publiceren de volgende informatie. De paden staan achter het eigen basisadres: `<prs-oauth-url>` of `<nvi-oauth-url>`.

| Informatie | Pad |
| --- | --- |
| OAuth-servermetadata | `/oauth/.well-known/oauth-authorization-server` |
| Publieke verificatiesleutels (JWKS) | `/oauth/jwks.json` |

De toegangsgateway controleert de handtekening en claims van het access token binnen onze infrastructuur. Aansluitende partijen hoeven de tokenhandtekening niet zelf te verifiëren of de JWKS op te halen. Vraag het token aan bij de OAuth-service en stuur het mee in de `Authorization: Bearer <token>`-header bij API-aanroepen.

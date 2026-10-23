---
title: "PRS"
type: "page"
sections:
  - id: wat-de-prs-doet
    title: "Wat de PRS doet"
  - title: "Ontwerp"
    children:
      - id: concept-pseudonimiseringsstromen
        title: "Gebruiksmogelijkheden"
      - id: concept-ontwerpprincipes
        title: "Ontwerpprincipes"
      - id: architectuur
        title: "Architectuur en vertrouwen"
  - id: oauth-token
    title: "OAuth: parameters en scopes"
    children:
      - id: oauth-token-ophalen
        title: "Token ophalen"
  - id: api-overzicht
    title: "API-overzicht"
    children:
      - id: persoonsgegevens-en-context
        title: "Persoonsnummer en context"
      - id: api-omkeerbaar
        title: "Omkeerbaar pseudoniem"
      - id: api-niet-omkeerbaar
        title: "Niet-omkeerbaar pseudoniem"
      - id: jwe-contract
        title: "JWE ontvangen en controleren"
  - id: api-oprf-uitwisseling
    title: "Geblindeerde OPRF-uitwisseling"
    children:
      - id: oprf-uitleg
        title: "OPRF en de drie partijen"
      - id: oprf-flow
        title: "Uitwisseling in vier stappen"
      - id: bsn-afschermen
        title: "1. BSN afschermen"
      - id: evaluatie-aanvragen
        title: "2. Evaluatie aanvragen"
      - id: doorsturen-naar-receiver
        title: "3. Doorsturen naar de ontvanger"
      - id: ontsleutelen-unblinden
        title: "4. Ontsleutelen en unblinden"
  - id: receiver-instellen
    title: "Ontvanger en sleutelbeheer"
    children:
      - id: sleutelversies
        title: "Sleutelversies en rotatie"
  - id: saml-exchange
    title: "SAML-exchange in testomgevingen"
  - id: foutafhandeling
    title: "Foutafhandeling"
  - id: service-informatie
    title: "Service-informatie en testroutes"
heading: "👤 PRS — Pseudoniemendienst"
service: prs
---

De Pseudoniemendienst (PRS) maakt pseudoniemen voor een ontvangende organisatie en een afgesproken gebruikstoepassing. Volg de [aansluitinstructies](/integration/aansluiten/), regel de organisatiebevoegdheden en [registreer de ontvangstsleutel](#receiver-instellen) voordat je pseudoniemen aanvraagt.

{{% card %}}

### Wat de PRS doet {#wat-de-prs-doet}

Met de PRS kunnen organisaties over een persoon communiceren zonder onderling het BSN uit te wisselen. Een pseudoniem is afgeleid van een persoonsnummer en hoort bij een specifieke ontvanger, toepassing en sleutelversie. Het is daarmee geschikt voor herkenning binnen die context.

De PRS ondersteunt het BSN als persoonsnummertype. Bij directe pseudonimisering verwerkt de PRS het persoonsnummer tijdelijk in leesbare vorm. Bij een geblindeerde OPRF-uitwisseling blijft het persoonsnummer ook voor de PRS afgeschermd.

{{% /card %}}

{{% card %}}

### Gebruiksmogelijkheden {#concept-pseudonimiseringsstromen}

{{% columns %}}

{{% column %}}

#### [Omkeerbaar pseudoniem](#api-omkeerbaar)

Lever een persoonsnummer aan. De PRS maakt een deterministisch pseudoniem dat zij later intern kan terugrekenen. De uitkomst wordt versleuteld voor de ontvanger.

{{% /column %}}

{{% column %}}

#### [Niet-omkeerbaar pseudoniem](#api-niet-omkeerbaar)

Lever een persoonsnummer aan, of een eerder voor jouw organisatie uitgegeven omkeerbaar pseudoniem. De PRS berekent een pseudoniem met een eenrichtingsfunctie en versleutelt de uitkomst voor de ontvanger.

{{% /column %}}

{{% column %}}

#### [Geblindeerde OPRF-uitwisseling](#api-oprf-uitwisseling)

De client blindeert het persoonsnummer lokaal. De PRS evalueert de geblindeerde waarde en versleutelt het resultaat voor de ontvanger. De ontvanger ontsleutelt en berekent het pseudoniem lokaal.

{{% /column %}}

{{% column %}}

#### [SAML-exchange voor tests](#saml-exchange)

Een afzonderlijk inschakelbare testkoppeling stuurt JSON door naar een interne SAML-dienst. Deze koppeling retourneert de invoer en voert geen SAML-validatie, ontsleuteling of pseudonimisering uit.

{{% /column %}}

{{% /columns %}}

De beschikbaarheid van de directe exchanges en de testkoppeling verschilt per omgeving. De [versie-informatie](#service-informatie) vermeldt welke functies zijn ingeschakeld.

{{% /card %}}

{{% card %}}

### Ontwerpprincipes {#concept-ontwerpprincipes}

#### Stabiele uitkomsten binnen een context

Dezelfde genormaliseerde invoer levert voor hetzelfde pseudoniemtype, dezelfde ontvanger, hetzelfde domein en dezelfde sleutelversie hetzelfde pseudoniem op. Een andere context levert een andere uitkomst. Zo kunnen systemen of onderzoeken elk hun eigen pseudoniemnamespace gebruiken. Sleutelrotatie verandert de pseudoniemen; plan daarom de migratie van opgeslagen verwijzingen.

Het domein wordt in aanvragen meegegeven als `recipientScope`. Dit is een vrij gekozen identificatie van de gebruikstoepassing. De OAuth-scope bepaalt welke API-operatie je mag uitvoeren. Spreek de domeinwaarde vooraf af met de ontvanger en gebruik exact dezelfde waarde bij iedere aanvraag.

#### Versleuteling voor de ontvanger

De PRS verpakt zowel directe pseudoniemen als OPRF-evaluaties in een JWE. De geregistreerde publieke RSA-sleutel van de ontvanger bepaalt wie de uitvoer kan lezen. De ontvanger beheert de bijbehorende private key en bewaart die in de eigen omgeving. Deze decryptiesleutel staat los van de PRS-sleutels waarmee pseudoniemen worden berekend.

#### Gescheiden berekeningen en opslag

Omkeerbare pseudoniemen gebruiken AES-256-CBC met een deterministische IV uit twee HMAC-SHA256-bewerkingen en een integriteitscontrole bij omkering. AES en HMAC gebruiken afzonderlijke sleutels. Niet-omkeerbare pseudoniemen gebruiken HMAC-SHA256 met eigen sleutelmateriaal. De OPRF-berekening gebruikt een afzonderlijk OPRF-secret.

De PRS slaat geen persoonsnummer-pseudoniemkoppelingen op. De database bevat organisaties, bevoegdheden, publieke ontvangstsleutels en metadata over sleutelversies. Pseudoniemen worden bij een aanvraag opnieuw berekend. De functionele audit-events leggen de operatie en organisatiecontext vast zonder persoonsnummer of pseudoniem.

{{% /card %}}

{{% card %}}

### Architectuur en vertrouwen {#architectuur}

Een aanvraag doorloopt de volgende onderdelen:

| Onderdeel | Verantwoordelijkheid |
| --- | --- |
| OAuth-service | Authenticeert de geregistreerde client via mTLS en geeft een access token uit voor de gevraagde organisatie, doelservice en bevoegdheden. |
| OIN-verifier / toegangsgateway | Controleert het clientcertificaat en Bearer-token, verwijdert aangeleverde interne identiteitsheaders en geeft de geverifieerde identiteit en scopes door aan de PRS. |
| PRS API en pseudoniemservices | Controleren de audience, scope, organisatiebevoegdheden en ontvangstsleutel; valideren directe persoonsnummers en voeren de gekozen pseudonimisering uit. |
| Crypto-service / HSM | Voert in een HSM-omgeving de cryptografische operaties uit met het betreffende sleutelmateriaal. De PRS gebruikt daarvoor een intern HTTP-koppelvlak. |
| PRS-database | Bewaart organisatieregistraties, verzoek- en ontvangstbevoegdheden, publieke sleutels met domeinen en sleutelversies met geldigheidsperioden. |
| Auditlogging | Registreert onder meer operatie, handelende organisatie, organisatie namens wie wordt gehandeld, ontvanger en gebruikte sleutelversie. |
| Ontvanger | Ontsleutelt de JWE, controleert de claims en gebruikt het pseudoniem. Bij OPRF voert de ontvanger ook het unblinden uit. |

De PRS vertrouwt op de identiteit die de OIN-verifier doorgeeft. Het PRS-applicatieproces controleert zelf geen Bearer-handtekening en authenticeert de externe client niet zelfstandig met mTLS. De toegang tot dat proces moet daarom uitsluitend via de verifier lopen. Interne `x-gf-*`-headers worden door de gateway gezet en horen niet in clientaanvragen.

Autorisatie kent twee lagen. De OAuth-scope geeft toegang tot de operatie. Daarnaast moet de organisatie namens wie je handelt het betreffende pseudoniemtype mogen aanvragen, en moet de ontvanger dat type mogen ontvangen. Deze organisatiebevoegdheden worden door een PRS-beheerder toegekend. De PRS controleert eerst de aanvrager en daarna de ontvanger. Sleutelbeheer is altijd beperkt tot de organisatie namens wie de aanvraag wordt gedaan.

In een HSM-omgeving wordt het berekeningssleutelmateriaal per organisatie, sleuteltype en versie beheerd. Het domein maakt deel uit van de invoer van de directe pseudoniemberekening. Bij OPRF verwerkt de client de ontvanger en het domein vooraf in de afgeleide invoer. Lokale ontwikkelomgevingen kunnen lokale berekeningssleutels gebruiken.

{{% /card %}}

{{% anchor id="oauth-token" %}}

{{% card %}}

### OAuth-token voor PRS

Gebruik de PRS OAuth-service om een access token op te halen. Stuur de vijf verplichte formuliervelden `grant_type`, `target_audience`, `scope`, `organization_external_id` en `client_id` mee. `client_id` is de bij de clientregistratie verstrekte UUID. `organization_external_id` identificeert de organisatie namens wie je handelt; gebruik voor PRS het kale OIN van 20 posities, zonder `oin:`-prefix.

{{< endpoint method="POST" oauth=true path="/token" >}}

#### Parameters

{{% oauth-parameters %}}

#### Scopes

<div class="oauth-scopes-wrap" tabindex="0" role="region" aria-label="Scopes voor PRS">

| Scope | Omschrijving |
| --- | --- |
| `prs:pseudonym` | Omkeerbare en niet-omkeerbare directe exchanges. |
| `prs:oprf-pseudonym` | Geblindeerde OPRF-evaluatie. |
| `prs:administration` | Eigen publieke ontvangstsleutels en sleutelversies beheren. |
| `prs:saml-pseudonym` | SAML-testkoppeling, indien ingeschakeld. |

</div>

Vraag alleen de benodigde scopes aan. Meerdere scopes worden door spaties gescheiden. Een token met een geldige scope vervangt de organisatiebevoegdheden voor aanvragen en ontvangen niet.

{{% /card %}}

{{% card %}}

### Token ophalen {#oauth-token-ophalen}

Vervang `{{% service "oauth.url_placeholder" %}}` door het basisadres van de OAuth-omgeving, inclusief `https://` en een eventuele versieprefix, zonder afsluitende slash. Vul de geregistreerde client-ID, organisatie en target audience in. De voorbeelden vragen een token aan voor de OPRF-operatie.

{{% tabs %}}

{{% tab "cURL" %}}

```bash
curl --fail-with-body -sS -X POST \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=prs:oprf-pseudonym" \
  --data-urlencode "target_audience={{% service "oauth.target_audience_example" %}}" \
  --data-urlencode "organization_external_id=<oin-aanvrager>" \
  --data-urlencode "client_id=<geregistreerde-client-uuid>" \
  "{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token"
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
$handle = curl_init('{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token');
curl_setopt_array($handle, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSLCERT => 'client-cert.pem',
    CURLOPT_SSLKEY => 'client-key.pem',
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type' => 'client_credentials',
        'scope' => 'prs:oprf-pseudonym',
        'target_audience' => '{{% service "oauth.target_audience_example" %}}',
        'organization_external_id' => '<oin-aanvrager>',
        'client_id' => '<geregistreerde-client-uuid>',
    ]),
]);
$body = curl_exec($handle);
$status = curl_getinfo($handle, CURLINFO_HTTP_CODE);
if ($body === false || $status !== 200) {
    throw new RuntimeException('Tokenaanvraag mislukt');
}
$token = json_decode($body, true, 512, JSON_THROW_ON_ERROR)['access_token'];
curl_close($handle);
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import requests

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")
response = session.post(
    "{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token",
    data={
        "grant_type": "client_credentials",
        "scope": "prs:oprf-pseudonym",
        "target_audience": "{{% service "oauth.target_audience_example" %}}",
        "organization_external_id": "<oin-aanvrager>",
        "client_id": "<geregistreerde-client-uuid>",
    },
    timeout=30,
)
response.raise_for_status()
access_token = response.json()["access_token"]
```

{{% /tab %}}

{{% /tabs %}}

De succesvolle respons is `200 OK` met JSON:

```json
{
  "token_type": "Bearer",
  "access_token": "<jwt-access-token>",
  "scope": "prs:oprf-pseudonym"
}
```

Gebruik `Authorization: Bearer <jwt-access-token>` bij beschermde API-aanroepen. De [algemene OAuth-uitleg](/integration/oauth/#metadata-en-tokenverificatie) beschrijft hoe de infrastructuur het token controleert.

{{% /card %}}

{{% /anchor %}}

{{% card %}}

### API-overzicht {#api-overzicht}

Alle onderstaande paden zijn relatief aan `{{% service "base_path" %}}`. Vul het serveradres inclusief een eventuele versieprefix in als `{{% service "url_placeholder" %}}`. De API-basis-URL in de voorbeelden is `{{% service "url_placeholder" %}}{{% service "base_path" %}}`. Stuur JSON-aanvragen met `Content-Type: application/json`, een Bearer-token met de vereiste scope en het clientcertificaat voor mTLS.

| Methode | Pad | OAuth-scope | Succesrespons |
| --- | --- | --- | --- |
| `POST` | `/exchange/reversible-pseudonym` | `prs:pseudonym` | `201`, `application/jwe`: compact JWE-token. |
| `POST` | `/exchange/irreversible-pseudonym` | `prs:pseudonym` | `201`, `application/jwe`: compact JWE-token. |
| `POST` | `/oprf/eval` | `prs:oprf-pseudonym` | `200`, JSON-object met `jwe`. |
| `POST` | `/administration/keys` | `prs:administration` | `201`, geregistreerde publieke sleutel. |
| `GET` | `/administration/keys` | `prs:administration` | `200`, lijst van eigen publieke sleutels. |
| `PUT` | `/administration/keys/{id}` | `prs:administration` | `200`, bijgewerkte publieke sleutel. |
| `DELETE` | `/administration/keys/{id}` | `prs:administration` | `200`, `{"message":"key deleted"}`. |
| `POST` | `/administration/key-versions` | `prs:administration` | `201`, nieuwe sleutelversie. |
| `GET` | `/administration/key-versions` | `prs:administration` | `200`, lijst van eigen sleutelversies. |
| `PUT` | `/administration/key-versions/{id}` | `prs:administration` | `200`, bijgewerkte sleutelversie. |

De twee routes onder `/exchange` zijn beschikbaar wanneer directe pseudonimisering is ingeschakeld. De beheerroutes, OPRF-evaluatie en publieke service-informatie zijn afzonderlijk beschikbaar.

{{% /card %}}

{{% card %}}

### Persoonsnummer en context {#persoonsgegevens-en-context}

Directe exchanges gebruiken de volgende velden:

| Veld | Type | Betekenis |
| --- | --- | --- |
| `personalId` | String of object | `NL:bsn:950000012`, of `{"landCode":"NL","type":"bsn","value":"950000012"}`. |
| `recipientOrganization` | String | OIN van de ontvanger met prefix `oin:`, bijvoorbeeld `oin:00000099000000001000`. |
| `recipientScope` | String | Afgesproken domein van de ontvanger; 1–100 tekens, zonder `\|`. |

Het OIN telt 20 posities: acht cijfers voor de prefix, een hoofdnummer van acht of negen alfanumerieke tekens en respectievelijk vier of drie afsluitende nullen. Geef een OIN altijd als string door, zodat voorloopnullen behouden blijven.

Het persoonsnummertype is `bsn`. De PRS normaliseert de landcode naar hoofdletters, het type naar kleine letters en verwijdert witruimte rondom het nummer. Het BSN moet negen cijfers bevatten en aan de elfproef voldoen. Gebruik het nummer als string om voorloopnullen te behouden. De voorbeelden gebruiken een testwaarde.

De ontvangende organisatie moet geregistreerd zijn, het gevraagde pseudoniemtype mogen ontvangen en een publieke sleutel hebben voor het domein. Voor directe pseudonimisering is ook een actieve berekeningssleutelversie nodig. De aanvragende organisatie moet het betreffende type mogen aanvragen.

{{% /card %}}

{{% card %}}

### Omkeerbaar pseudoniem aanvragen {#api-omkeerbaar}

{{< endpoint method="POST" path="/exchange/reversible-pseudonym" >}}

Vereiste OAuth-scope: `prs:pseudonym`. De aanvrager moet `reversible_pseudonym` mogen aanvragen en de ontvanger moet `reversible_pseudonym` mogen ontvangen.

```bash
curl --fail-with-body -sS -X POST \
  --cert client-cert.pem --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/jwe" \
  -d '{
    "personalId": {"landCode":"NL","type":"bsn","value":"950000012"},
    "recipientOrganization": "oin:00000099000000001000",
    "recipientScope": "nationale-verwijsindex"
  }' \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/exchange/reversible-pseudonym"
```

De respons is `201 Created` met `Content-Type: application/jwe`. De body bevat rechtstreeks het compact geserialiseerde JWE-token. Lees deze respons als tekst. De ontsleutelde payload bevat `subject: "pseudonym:reversible:<waarde>"` en `keyVersion` met de gebruikte, hoogste actieve sleutelversie.

Alleen de PRS kan het omkeerbare pseudoniem terugrekenen. Voor omzetting naar een niet-omkeerbaar pseudoniem kan de organisatie voor wie het is uitgegeven de ontsleutelde waarde als `reversiblePseudonym` aanbieden bij de volgende operatie. De JWE zelf is geen geldige waarde voor dat veld.

{{% /card %}}

{{% card %}}

### Niet-omkeerbaar pseudoniem aanvragen {#api-niet-omkeerbaar}

{{< endpoint method="POST" path="/exchange/irreversible-pseudonym" >}}

Vereiste OAuth-scope: `prs:pseudonym`. De aanvrager moet `irreversible_pseudonym` mogen aanvragen en de ontvanger moet `irreversible_pseudonym` mogen ontvangen. De uitkomst wordt met HMAC-SHA256 berekend; er is geen API-operatie die deze uitkomst terugrekent naar een persoonsnummer.

Lever **precies één** van de velden `personalId` en `reversiblePseudonym` aan, samen met `recipientOrganization` en `recipientScope`. Andere velden worden afgewezen.

{{% tabs %}}

{{% tab "Persoonsnummer" %}}

```json
{
  "personalId": "NL:bsn:950000012",
  "recipientOrganization": "oin:00000099000000001000",
  "recipientScope": "nationale-verwijsindex"
}
```

{{% /tab %}}

{{% tab "Omkeerbaar pseudoniem" %}}

```json
{
  "reversiblePseudonym": "pseudonym:reversible:<base64url-waarde>",
  "recipientOrganization": "oin:00000099000000001000",
  "recipientScope": "nationale-verwijsindex"
}
```

Het prefix `pseudonym:reversible:` is optioneel. De waarde moet zijn uitgegeven voor de organisatie namens wie je de aanvraag doet. De PRS rekent het pseudoniem intern terug en berekent vervolgens de uitkomst voor de nieuwe ontvanger en het opgegeven domein. Het persoonsnummer wordt niet teruggegeven.

{{% /tab %}}

{{% /tabs %}}

Gebruik hetzelfde aanroeppatroon als bij de omkeerbare exchange, met het pad `/exchange/irreversible-pseudonym`. De respons is `201 Created`, `application/jwe`, met het JWE-token rechtstreeks in de body. Na ontsleuteling bevat `subject` de waarde `pseudonym:irreversible:<waarde>`. `keyVersion` identificeert de hoogste actieve sleutelversie. Zijn oudere versies tegelijk actief, dan bevat `extraVersions` hun waarden:

```json
{
  "subject": "pseudonym:irreversible:<waarde-versie-2>",
  "aud": "oin:00000099000000001000",
  "scope": "nationale-verwijsindex",
  "version": "1.1",
  "iat": 1792620000,
  "exp": 1792620300,
  "keyVersion": 2,
  "extraVersions": {"1": "<waarde-versie-1>"}
}
```

`extraVersions` ontbreekt bij deze operatie wanneer er geen oudere actieve versies zijn. De waarden in die map bevatten geen `pseudonym:irreversible:`-prefix. Gebruik de oude en nieuwe waarde tijdens een migratie om bestaande verwijzingen aan de nieuwe sleutelversie te koppelen.

{{% /card %}}

{{% card %}}

### JWE ontvangen en controleren {#jwe-contract}

De PRS gebruikt een compact JWE-token met vijf door punten gescheiden delen. De beschermde header bevat:

| Header | Waarde |
| --- | --- |
| `alg` | `RSA-OAEP` |
| `enc` | `A256GCM` |
| `cty` | `application/json` |
| `kid` | `kid` van de geregistreerde publieke ontvangstsleutel. |

Het ontsleutelde JSON-object bevat de volgende claims:

| Claim | Betekenis |
| --- | --- |
| `subject` | `pseudonym:reversible:<waarde>`, `pseudonym:irreversible:<waarde>` of `pseudonym:eval:<waarde>`. |
| `aud` | Ontvanger als `oin:<oin>`. |
| `scope` | Het aangevraagde domein (`recipientScope`). |
| `version` | Payloadformaat `"1.1"`; dit is geen berekeningssleutelversie. |
| `iat` | Uitgiftetijd als Unix-timestamp in seconden. |
| `exp` | Vervaltijd, 300 seconden na `iat`. |
| `keyVersion` | Gebruikte sleutelversie bij directe exchanges. |
| `extraVersions` | Oudere actieve uitkomsten bij niet-omkeerbare pseudoniemen en OPRF. |

Kies de eigen private key op basis van `kid`, beperk de toegestane algoritmen tot bovenstaande waarden, ontsleutel de JWE en controleer `aud`, `scope`, `version`, het verwachte `subject`-type en de tijdclaims. Het succesvol ontsleutelen alleen voert die toepassingscontroles niet uit. De versleuteling beschermt de uitvoer tijdens de overdracht; de vervaltijd hoort bij de JWE en bepaalt niet de levensduur van een daarna opgeslagen pseudoniem.

De ontvangstsleutel heeft een eigen `kid`. Het vervangen van die sleutel verandert de versleutelde verpakking, terwijl de berekeningssleutelversie bepaalt welk pseudoniem wordt afgeleid.

{{% /card %}}

{{% card %}}

### Geblindeerde OPRF-uitwisseling {#api-oprf-uitwisseling}

Bij OPRF (Oblivious Pseudo-Random Function) wordt het persoonsnummer lokaal afgeschermd voordat het naar de PRS gaat. De PRS verwerkt een geblindeerd Ristretto255-groepselement en retourneert de evaluatie als JWE voor de ontvangende organisatie. De client geeft de JWE en de blind factor aan die ontvanger; de ontvanger berekent het deterministische pseudoniem.

{{% /card %}}

{{% card %}}

### OPRF en de drie partijen {#oprf-uitleg}

| Partij | Beschikt over | Ontvangt via dit protocol niet |
| --- | --- | --- |
| Client | Persoonsnummer, afgesproken ontvangercontext en willekeurige blind factor. | Serversleutel en ontsleutelde evaluatie. |
| PRS | Geblindeerde invoer, eigen OPRF-secret en publieke sleutel van de ontvanger. | Persoonsnummer en blind factor. |
| Ontvanger | Eigen private key, evaluatie en doorgegeven blind factor. | Persoonsnummer en OPRF-secret. |

Blinding verbergt de oorspronkelijke invoer voor de PRS. De JWE voorkomt dat de client, die de blind factor kent, het evaluatieresultaat zelf kan unblinden. De rolverdeling veronderstelt dat de client niet over de private key van de ontvanger beschikt.

De OPRF-evaluatie controleert of de geblindeerde invoer een geldig Ristretto255-groepselement is. De PRS kan achter de blinding niet controleren of de client werkelijk een BSN heeft gebruikt of de afgesproken ontvangercontext correct heeft verwerkt. Daarom moeten de aangesloten clients dezelfde invoerafspraken volgen.

{{% /card %}}

{{% card %}}

### Uitwisseling in vier stappen {#oprf-flow}

![OPRF swimlane: Client → PRS → Ontvanger](/assets/img/oprf-flow.svg)

{{% steps %}}

{{% step number="1" %}}

#### Client: BSN afschermen

Normaliseer en serialiseer het persoonsnummer. Leid met HKDF-SHA256 een 32-byte invoer af, met ontvanger en domein als context. Blind de invoer lokaal en bewaar de blind factor voor de ontvanger.

{{% /step %}}

{{% step number="2" %}}

#### Client → PRS: evaluatie aanvragen

Stuur de geblindeerde invoer, `recipientOrganization` en `recipientScope` naar `POST /oprf/eval`. De PRS controleert de bevoegdheden, selecteert de ontvangstsleutel en voert de evaluatie uit. De respons bevat een JWE voor de ontvanger.

{{% /step %}}

{{% step number="3" %}}

#### Client → ontvanger: JWE en blind factor doorgeven

Gebruik het aanlevercontract van de ontvanger om beide waarden door te sturen. De client kan de evaluatie in de JWE niet lezen.

{{% /step %}}

{{% step number="4" %}}

#### Ontvanger: ontsleutelen en unblinden

De ontvanger ontsleutelt de JWE, controleert de context en combineert de evaluatie met de blind factor. De uitkomst is het pseudoniem voor deze invoer, ontvangercontext en OPRF-sleutelversie.

{{% /step %}}

{{% /steps %}}

{{% /card %}}

{{% card %}}

### Stap 1 — BSN afschermen {#bsn-afschermen}

Het onderstaande Python-voorbeeld gebruikt `requests`, `cryptography` en `pyoprf`. Voor `pyoprf` moet ook de native bibliotheek `liboprf` op het systeem beschikbaar zijn. Spreek één serialisatie af voor alle clients: een andere hoofdletter, andere veldvolgorde of witruimte in de gehashte invoer kan een ander pseudoniem opleveren. Het voorbeeld gebruikt exact `{"landCode":"NL","type":"bsn","value":"950000012"}` als UTF-8-invoer voor HKDF.

`RECV_ORG` is het OIN met `oin:`-prefix. `RECV_SCOPE` is het domein dat bij de ontvangstsleutel is geregistreerd. De HKDF-context is exact `<RECV_ORG>|<RECV_SCOPE>|v1`. De suffix `v1` hoort bij deze invoerafspraak en is geen keuze voor een PRS-sleutelversie.

```python
import base64
import json

import pyoprf
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

RECV_ORG = "oin:00000099000000001000"
RECV_SCOPE = "nationale-verwijsindex"

personal_id = json.dumps(
    {"landCode": "NL", "type": "bsn", "value": "950000012"},
    sort_keys=True,
    separators=(",", ":"),
).encode("utf-8")

hkdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=f"{RECV_ORG}|{RECV_SCOPE}|v1".encode("utf-8"),
)
derived_input = hkdf.derive(personal_id)
blind_factor, blinded_input = pyoprf.blind(derived_input)

blinded_input_b64 = base64.urlsafe_b64encode(blinded_input).decode("ascii")
blind_factor_b64 = base64.urlsafe_b64encode(blind_factor).decode("ascii")
```

Genereer bij iedere aanvraag een nieuwe blind factor. Stuur alleen de geblindeerde invoer naar de PRS. Bewaar de blind factor totdat de ontvanger de bijbehorende evaluatie heeft verwerkt.

{{% /card %}}

{{% card %}}

### Stap 2 — Evaluatie aanvragen {#evaluatie-aanvragen}

{{< endpoint method="POST" path="/oprf/eval" >}}

Vereiste OAuth-scope: `prs:oprf-pseudonym`. De aanvragende organisatie moet `oprf` mogen aanvragen en de ontvanger moet `oprf` mogen ontvangen.

| Veld | Type | Betekenis |
| --- | --- | --- |
| `encryptedPersonalId` | String | Base64url van het geblindeerde, niet-neutrale Ristretto255-element van 32 bytes. Padding `=` mag aanwezig zijn. |
| `recipientOrganization` | String | OIN met `oin:`-prefix. |
| `recipientScope` | String | Domein voor de ontvangstsleutel; minimaal twee tekens. |

Ondanks de veldnaam bevat `encryptedPersonalId` een geblindeerde waarde. Lever hier geen plaintext BSN, direct pseudoniem of JWE aan.

Dit voorbeeld sluit aan op stap 1. Vul het PRS-serveradres en token in:

```python
PRS_BASE_URL = "{{% service "url_placeholder" %}}{{% service "base_path" %}}"

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")
response = session.post(
    f"{PRS_BASE_URL}/oprf/eval",
    headers={"Authorization": "Bearer <token-met-prs:oprf-pseudonym>"},
    json={
        "encryptedPersonalId": blinded_input_b64,
        "recipientOrganization": RECV_ORG,
        "recipientScope": RECV_SCOPE,
    },
    timeout=30,
)
response.raise_for_status()
jwe_token = response.json()["jwe"]
```

De respons is `200 OK` met `Content-Type: application/json`:

```json
{"jwe":"<compact-jwe-token>"}
```

Na ontsleuteling bevat `subject` de hoogste actieve evaluatie als `pseudonym:eval:<base64url-evaluatie>`. `extraVersions` bevat oudere actieve evaluaties met hun versienummer als sleutel, bijvoorbeeld `{"1":"<base64url-evaluatie>"}`. Deze map is leeg als er geen oudere actieve versie is. Iedere evaluatie moet met dezelfde blind factor afzonderlijk worden geünblind. De OPRF-payload bevat geen `keyVersion`-claim voor de waarde in `subject`.

{{% /card %}}

{{% card %}}

### Stap 3 — Doorsturen naar de ontvanger {#doorsturen-naar-receiver}

Stuur de ontvangen `jwe_token` en de bijbehorende `blind_factor_b64` naar de ontvanger via het door die dienst voorgeschreven endpoint en formaat. Dit is een afzonderlijke aanroep aan de ontvanger, met diens eigen authenticatie en autorisatie.

Voor registratie bij de NVI volg je de instructies voor [lokalisatie registreren](/integration/nvi/#lokalisatie-registreren).

{{% /card %}}

{{% card %}}

### Stap 4 — Ontsleutelen en unblinden {#ontsleutelen-unblinden}

De ontvanger gebruikt `jwcrypto` en `pyoprf`. De private key blijft bij de ontvanger. Vul `EXPECTED_KID` in met de geregistreerde sleutelidentificatie en gebruik de afgesproken organisatie en het domein. De invoervariabelen `jwe_token` en `blind_factor_b64` komen uit de aanlevering door de client.

```python
import base64
import json
import time
from pathlib import Path

import pyoprf
from jwcrypto import jwe, jwk

EXPECTED_ORG = "oin:00000099000000001000"
EXPECTED_SCOPE = "nationale-verwijsindex"
EXPECTED_KID = "<geregistreerde-kid>"

private_key = jwk.JWK.from_pem(Path("receiver-private-key.pem").read_bytes())
token = jwe.JWE(algs=["RSA-OAEP", "A256GCM"])
token.deserialize(jwe_token)
if token.jose_header.get("kid") != EXPECTED_KID:
    raise ValueError("Onbekende ontvangstsleutel")
token.decrypt(private_key)
payload = json.loads(token.payload)

now = int(time.time())
if payload.get("aud") != EXPECTED_ORG or payload.get("scope") != EXPECTED_SCOPE:
    raise ValueError("Onverwachte ontvangercontext")
if payload.get("version") != "1.1":
    raise ValueError("Onbekend payloadformaat")
if not isinstance(payload.get("iat"), int) or not isinstance(payload.get("exp"), int):
    raise ValueError("Ontbrekende of ongeldige tijdclaims")
if not payload["iat"] <= now < payload["exp"]:
    raise ValueError("JWE is niet geldig op dit tijdstip")

prefix = "pseudonym:eval:"
subject = payload.get("subject", "")
if not isinstance(subject, str) or not subject.startswith(prefix):
    raise ValueError("Onverwacht pseudoniemtype")

blind_factor = base64.urlsafe_b64decode(blind_factor_b64)

def unblind_value(value):
    evaluated = base64.urlsafe_b64decode(value)
    result = pyoprf.unblind(blind_factor, evaluated)
    return base64.urlsafe_b64encode(result).decode("ascii")

pseudonym = unblind_value(subject[len(prefix):])
older_pseudonyms = {
    version: unblind_value(value)
    for version, value in payload.get("extraVersions", {}).items()
}
```

Sla het resultaat op volgens het gegevensmodel van de ontvanger. De pseudoniemwaarde uit `subject` en de oudere waarden kunnen tijdens een sleutelrotatie naar dezelfde persoon verwijzen binnen de afgesproken context.

{{% /card %}}

{{% card %}}

### Ontvanger instellen en publieke sleutels beheren {#receiver-instellen}

Laat de ontvangende organisatie eerst door een PRS-beheerder registreren en de benodigde ontvangstbevoegdheden toekennen. De organisatie kan daarna met `prs:administration` haar eigen publieke decryptiesleutels beheren. Deze sleutels worden apart aangeleverd; de PRS neemt de ontvangstsleutel niet automatisch over uit het mTLS-clientcertificaat.

#### Publieke sleutel registreren

{{< endpoint method="POST" path="/administration/keys" >}}

Maak een RSA-sleutelpaar van minimaal 3072 bits. Bewaar de private key bij de ontvanger. Lever de publieke sleutel als JWK aan in de header van een met dezelfde private key ondertekende JWS. Daarmee bewijs je dat je de bijbehorende private key bezit.

| Veld of onderdeel | Vereiste |
| --- | --- |
| Requestveld `domains` | Lijst domeinen waarvoor de sleutel wordt gebruikt. De waarde `*` is een wildcard. |
| Requestveld `jws` | Geserialiseerde, zelf ondertekende JWS; minimaal 32 tekens. |
| JWS-header `jwk` | Publieke RSA-JWK, minimaal 3072 bits, inclusief `kid`; geen private sleutelcomponenten. |
| JWS-payload `oin` | Kaal OIN, zonder `oin:`-prefix, gelijk aan de organisatie namens wie je handelt. |
| JWS-payload `iat` | Actuele Unix-timestamp; registraties ouder dan één uur worden afgewezen. |
| JWS-handtekening | Geldige handtekening onder de meegeleverde publieke sleutel. Het voorbeeld gebruikt `RS256`. |

Genereer voor een bestaande sleutel met `jwcrypto` de registratieaanvraag. Zorg dat `receiver-private-key.pem` een RSA-private key met de vereiste sleutelgrootte bevat:

```python
import json
import time
from pathlib import Path

from jwcrypto import jwk, jws

key = jwk.JWK.from_pem(Path("receiver-private-key.pem").read_bytes())
key["kid"] = key.thumbprint()
proof = jws.JWS(json.dumps({
    "oin": "00000099000000001000",
    "iat": int(time.time()),
}).encode("utf-8"))
proof.add_signature(
    key,
    protected=json.dumps({
        "alg": "RS256",
        "jwk": key.export_public(as_dict=True),
    }),
)
registration = {
    "domains": ["nationale-verwijsindex"],
    "jws": proof.serialize(compact=True),
}
Path("key-registration.json").write_text(json.dumps(registration), encoding="utf-8")
```

Verstuur het bestand met een token met `prs:administration`:

```bash
curl --fail-with-body -sS -X POST \
  --cert client-cert.pem --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @key-registration.json \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/administration/keys"
```

De respons is `201 Created` met een JSON-object van deze vorm:

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "domains": ["nationale-verwijsindex"],
  "jwk": {"kty":"RSA","kid":"<sleutelidentificatie>","n":"<modulus>","e":"AQAB"}
}
```

Gebruik bij pseudoniemaanvragen exact een van de geregistreerde domeinen als `recipientScope`. De PRS zoekt eerst een sleutel voor dat specifieke domein en daarna een sleutel met `*`. Een domein dat al aan een andere sleutel van dezelfde organisatie is gekoppeld geeft `409 Conflict`.

#### Opvragen, vervangen en verwijderen

| Operatie | Aanvraag | Respons |
| --- | --- | --- |
| `GET /administration/keys` | Geen body. | `200`, array van objecten met `id`, `domains` en `jwk`. |
| `PUT /administration/keys/{id}` | UUID van de eigen sleutel; body met `domains` en een nieuwe `jws` volgens hetzelfde contract als registratie. | `200`, bijgewerkt object met `id`, `domains` en `jwk`. |
| `DELETE /administration/keys/{id}` | UUID van de eigen sleutel; geen body. | `200`, `{"message":"key deleted"}`. |

Vervangen wijzigt zowel de domeinenlijst als de sleutel. Maak een nieuw bewijs met een actuele `iat`. Een onbekend ID of een sleutel van een andere organisatie geeft `404`. Een organisatie die niet geregistreerd is geeft `403`. Een ongeldig registratiebewijs geeft `422`.

Bewaar een oude private key zolang eerder voor die sleutel uitgegeven JWE's nog moeten worden verwerkt. Het vervangen of verwijderen van de publieke registratie verandert reeds uitgegeven JWE's niet.

{{% /card %}}

{{% card %}}

### Sleutelversies en rotatie {#sleutelversies}

Berekeningssleutelversies bepalen de pseudoniemuitkomst en worden per organisatie beheerd. De publieke ontvangstsleutel en haar `kid` hebben een afzonderlijke levenscyclus. Alle onderstaande beheeraanroepen vereisen `prs:administration` en werken alleen op de eigen organisatie.

Een versie is actief wanneer `removed_at` leeg is, `from_dt` is bereikt en `until_dt` leeg is of in de toekomst ligt. Directe exchanges en OPRF in een HSM-omgeving gebruiken deze actieve versies. Een lokale OPRF-ontwikkelconfiguratie gebruikt de lokale serversleutel als versie 1.

| Methode en pad | Request | Respons |
| --- | --- | --- |
| `GET /administration/key-versions` | Geen body. | `200`, array met alle eigen versies, ook verlopen en verwijderde. |
| `POST /administration/key-versions` | Optionele body met `from_dt` en `until_dt`. | `201`, nieuwe versie met het hoogste bestaande versienummer plus één. |
| `PUT /administration/key-versions/{id}` | `{"until_dt":"<RFC3339-tijdstip>"}` of `{"until_dt":null}`. | `200`, bijgewerkte versie. |

Een versieobject bevat `id` (UUID), `organization_id` (interne organisatie-UUID), `version` (integer), `from_dt`, `until_dt` en `removed_at`. Tijdstippen bevatten een tijdzone, bijvoorbeeld `2026-11-01T00:00:00Z`. `until_dt` en `removed_at` kunnen `null` zijn.

Bij `POST` geldt: zonder `from_dt` start de versie direct; een opgegeven starttijd mag in het verleden liggen. Een opgegeven `until_dt` moet in de toekomst en na `from_dt` liggen. Er moet al een versie voor de organisatie bestaan; anders volgt `409` en moet de initiële inrichting worden geregeld. `PUT` wijzigt alleen `until_dt`; een opgegeven eindtijd moet in de toekomst liggen. `null` of een lege JSON-body wist de bestaande eindtijd. Onbekende requestvelden worden afgewezen.

#### Rotatie uitvoeren

1. Vraag de bestaande versies op en maak een nieuwe versie aan. Dit beëindigt de oude versie niet automatisch.
2. Stel voor de oude versie met `PUT` een eindtijd in. Tot dat moment overlappen de actieve versies.
3. Verwerk gedurende de overlap de nieuwe uitkomst en de waarden in `extraVersions` voor niet-omkeerbare pseudoniemen en OPRF. Omkeerbare pseudoniemen worden alleen met de hoogste actieve versie gemaakt.
4. Rond de migratie af voordat de oude versie afloopt. Een afzonderlijk opruimproces verwijdert het verlopen berekeningssleutelmateriaal en registreert `removed_at`.

Een omkeerbaar pseudoniem kan nog intern worden teruggelezen zolang zijn sleutelversie aanwezig is en niet als verwijderd is geregistreerd. Bij omzetting na verwijdering van de versie volgt `410 Gone`. Er is geen beheerroute om een verwijderde versie te herstellen. Het wijzigen van een versie die al is verwijderd geeft `409`.

{{% /card %}}

{{% card %}}

### SAML-exchange in testomgevingen {#saml-exchange}

`POST /saml-exchange/reversible-pseudonym` is alleen beschikbaar wanneer de SAML-testkoppeling is ingeschakeld. De vereiste OAuth-scope is `prs:saml-pseudonym`.

Deze route accepteert een JSON-body en stuurt die door naar de interne SAML-dienst. De testdienst geeft de invoer terug. Een succesvolle respons is `200 OK` met die JSON-uitvoer. Er wordt geen DigiD-handtekening gecontroleerd, geen assertion ontsleuteld en geen pseudoniem gegenereerd. Bij een fout of onbereikbaarheid van de interne SAML-dienst volgt `502` met `{"detail":"SAML exchange failed"}`.

{{% /card %}}

{{% card %}}

### Foutafhandeling {#foutafhandeling}

Fouten uit de PRS API gebruiken `Content-Type: application/json`. Een functionele fout bevat een `detail`-string, bijvoorbeeld:

```json
{"detail":"Invalid personal ID"}
```

Bij ongeldige requestvelden is de status `422` en bevat `detail` een lijst van validatiefouten met `type`, `loc` en `msg`:

```json
{
  "detail": [{
    "type": "missing",
    "loc": ["body", "recipientScope"],
    "msg": "Field required"
  }]
}
```

| Status | Betekenis en vervolgactie |
| --- | --- |
| `400` | Ongeldig persoonsnummer, ongeldig omkeerbaar pseudoniem of ongeldige OPRF-groepsinvoer. Corrigeer de invoer. |
| `403` | Ontbrekende of ongeldige autorisatiecontext, verkeerde audience, ontbrekende scope, onbekende aanvragende organisatie of ontbrekende aanvraagbevoegdheid. Controleer registratie en token. |
| `404` | Ontvanger onbekend of niet bevoegd, ontvangstsleutel voor het domein ontbreekt, geen actieve berekeningssleutelversie, of gevraagd beheerobject bestaat niet voor de eigen organisatie. Controleer de ontvangerinrichting. |
| `409` | Domein al gekoppeld aan een andere sleutel, geen initiële sleutelversie om te roteren, of wijziging van een al verwijderde versie. Controleer de bestaande inrichting. |
| `410` | Sleutelversie van een aangeleverd omkeerbaar pseudoniem is niet meer beschikbaar. Opnieuw aanbieden van hetzelfde pseudoniem herstelt die versie niet. |
| `422` | Ongeldig requestmodel, OIN, tijdstip of sleutelregistratiebewijs. Controleer de velden en foutlocaties. |
| `500` | Interne fout of mislukte directe pseudoniemberekening. |
| `502` | OPRF-evaluatie geweigerd door de cryptodienst, of fout in de SAML-testkoppeling. |
| `503` | Cryptodienst onbereikbaar bij een exchange; of databasecontrole ongezond bij `/health`. |
| `504` | Time-out bij OPRF-evaluatie. |

De toegangsgateway en OAuth-service kunnen een aanvraag al afwijzen voordat die de PRS bereikt. Het foutformaat van die componenten hoort bij hun eigen koppelvlak. Voorkom bij retries dat dezelfde functionele verwerking bij de ontvanger dubbel wordt uitgevoerd. De pseudoniemuitkomst is binnen dezelfde context stabiel; de JWE en haar tijdclaims worden per aanvraag opnieuw gemaakt.

{{% /card %}}

{{% card %}}

### Service-informatie en testroutes {#service-informatie}

| Methode en pad | Respons |
| --- | --- |
| `GET /` | Tekstbanner met versie- en commitinformatie wanneer beschikbaar. De gateway kan voor dit pad authenticatie vereisen. |
| `GET /version.json` | Buildinformatie met `features`: een array van ingeschakelde functies, elk met `id`, `title` en `description`. `404` als buildinformatie ontbreekt. |
| `GET /health` | `200` met `{"status":"ok","components":{"database":"ok"}}`, of `503` met `error` wanneer de databasecontrole faalt. |

`/version.json` en `/health` vereisen geen OAuth-token. De aansluitomgeving kan wel mTLS vereisen. De health check controleert de database en is geen volledige test van alle cryptografische afhankelijkheden.

Als testroutes zijn ingeschakeld, zijn daarnaast de volgende helpers beschikbaar. Zij vereisen een geauthenticeerde aanvraag met een voor de PRS bekende OAuth-scope, zonder aanvullende operatiescope:

| Methode en pad | Request | Succesrespons |
| --- | --- | --- |
| `POST /test/oprf/client` | `{"personalId":"<testinvoer>"}`; de waarde is een string en wordt rechtstreeks geblind. | `200` met `blinded_input` en `blind_factor`, beide base64url. |
| `POST /test/oprf/receiver` | `jwe`, `blind_factor` en `priv_key_pem`. | `200` met diagnostiek, ontsleutelde payload en `final_pseudonym`. |
| `POST /test/jwe/decode` | `jwe` en `priv_key_pem`. | `200` met JWE-diagnostiek en ontsleutelde payload. |

De helpers zijn bedoeld voor testgegevens en testsleutels. Gebruik bij de eigenlijke uitwisseling de lokale client- en ontvangerstappen: de helpers versturen testinvoer of private key naar de PRS en veranderen daarmee de gegevensverdeling. Bij decryptiefouten kan de helper diagnostiek met status `200` teruggeven; controleer de inhoud van de respons.

{{% /card %}}

{{< page-nav >}}
[← Terug naar overzicht](/integration/) [Volgende: NVI →](/integration/nvi/)
{{< /page-nav >}}

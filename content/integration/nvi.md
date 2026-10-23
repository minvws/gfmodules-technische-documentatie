---
title: "NVI"
type: "page"
sections:
  - id: wat-de-nvi-doet
    title: "Wat de NVI doet"
  - title: "Ontwerp"
    children:
      - id: concept-matching
        title: "Matching"
      - id: concept-ontwerpprincipes
        title: "Architectuur en gegevens"
  - id: api-oprf-invoer
    title: "OPRF-invoer"
    children:
      - id: identifier-opbouwen
        title: "Identifier opbouwen"
  - id: oauth-token
    title: "OAuth: parameters en scopes"
    children:
      - id: oauth-token-ophalen
        title: "Token ophalen"
  - title: "FHIR API"
    children:
      - id: lokalisatie-registreren
        title: "Registreren"
      - id: lokalisaties-opvragen
        title: "Zoeken en lokaliseren"
      - id: lokalisatie-ophalen
        title: "Ophalen op ID"
      - id: lokalisatie-verwijderen
        title: "Verwijderen"
      - id: fhir-bundles
        title: "Bundle verwerken"
      - id: fhir-metadata
        title: "FHIR-capabilities"
  - id: core-api
    title: "Core JSON API"
  - id: foutafhandeling
    title: "Foutafhandeling"
heading: "📑 NVI — Nationale Verwijs Index"
service: nvi
---

Volg eerst de [aansluitinstructies](/integration/aansluiten/) voor het clientcertificaat, de registratie en de mTLS-verbinding. Gebruik een [OAuth-token van de NVI](#oauth-token) voor de FHIR API en de Core JSON API. Beide gebruiken het basispad `{{% service "base_path" %}}` en dezelfde registraties.

{{% card %}}

### Wat de NVI doet {#wat-de-nvi-doet}

De NVI registreert welke zorgaanbieder gegevens over een persoon beschikbaar heeft en in welk bronsysteem die gegevens staan. Een registratie koppelt een beschermde persoonsidentificatie aan de URA van de zorgaanbieder en de identificatie van het bronsysteem (`source_id`). De NVI bevat geen diagnoses, documenten of andere zorginhoud.

{{% columns %}}

{{% column %}}

#### Bron registreert beschikbaarheid

Een bron registreert beschikbaarheid namens een zorgaanbieder. Dezelfde combinatie van persoon, URA en bronsysteem levert bij herhaling dezelfde registratie op. De bron kan de registratie verwijderen zodra de beschikbaarheid vervalt.

{{% /column %}}

{{% column %}}

#### Raadpleger lokaliseert bronnen

Een raadpleger zoekt welke zorgaanbieders en bronsystemen gegevens over een persoon hebben. Het resultaat bevat bronidentificaties. Het ophalen van adressen en zorggegevens vindt buiten de NVI plaats.

{{% /column %}}

{{% /columns %}}

Er is geen afzonderlijke zorgcontext of organisatietype in het registratie- en zoekcontract. Een resultaat zegt dat er gegevens beschikbaar zijn, zonder aan te geven welke gegevenscategorieën dat zijn.

{{% /card %}}

{{% card %}}

### Privacybeschermde matching {#concept-matching}

{{% steps %}}

{{% step number="1" %}}

#### Invoer lokaal blinderen

De client blindeert het BSN lokaal met een willekeurige blind factor. De PRS verwerkt de geblindeerde invoer en retourneert een voor de NVI versleutelde JWE. De client bewaart de bijbehorende blind factor.

{{% /step %}}

{{% step number="2" %}}

#### JWE en blind factor aanbieden

De client stuurt de JWE en de blind factor naar de NVI. Bij FHIR worden ze samen verpakt in een identifier; bij de Core API staan ze in twee afzonderlijke velden.

{{% /step %}}

{{% step number="3" %}}

#### Cryptografisch verwerken

De NVI laat de Crypto Service de JWE ontsleutelen en het geblindeerde resultaat deblinderen. Een HMAC-SHA256 over het PRS-pseudoniem levert een deterministische initialisatievector voor AES-versleuteling van dat pseudoniem. De cryptografische sleuteloperaties lopen via de HSM API; het uitpakken van de JWE-payload en het deblinderen gebeuren in de Crypto Service.

{{% /step %}}

{{% step number="4" %}}

#### Matchen en minimale gegevens teruggeven

De NVI gebruikt de combinatie van de initialisatievector en het versleutelde pseudoniem voor opslag en matching. De antwoorden bevatten de zorgaanbieder en het bronsysteem. Het FHIR-antwoord bevat daarnaast de registratie-ID; het Core-antwoord bevat de aanmaaktijd.

{{% /step %}}

{{% /steps %}}

{{% notice title="Geen BSN in het NVI-contract" %}}

Gebruik uitsluitend de PRS-uitvoer en de bijbehorende blind factor. De registratie- en lokalisatiecontracten bevatten geen BSN-veld. Succesvolle antwoorden geven de JWE, blind factor, het PRS-pseudoniem en de interne matchwaarde niet terug. De registratie legt wel een verband tussen een persoon en een zorgaanbieder; behandel ook deze beschikbaarheidsinformatie als gevoelig.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### Architectuur en gegevensbescherming {#concept-ontwerpprincipes}

De koppelvlakken vertalen FHIR- en JSON-berichten naar dezelfde registratie- en zoekoperaties. Hierdoor heeft een registratie die via de Core API wordt aangemaakt dezelfde betekenis als een registratie via de FHIR API.

| Onderdeel | Verantwoordelijkheid |
| --- | --- |
| Client en PRS | De client blindeert de invoer; de PRS evalueert die invoer en versleutelt het resultaat voor de NVI. |
| OAuth-service en API-toegang | Authenticatie van de handelende organisatie, tokenuitgifte en overdracht van gevalideerde organisatie-, scope- en brongegevens. |
| NVI-applicatie | Validatie van requests, controle van scopes, URA en bron, registratie, lokalisatie en logging. |
| Crypto Service en HSM API | Ontsleutelen, deblinderen en beschermen van de interne persoonsreferentie, gescheiden van de registratieopslag. |
| PostgreSQL | Opslag van registraties en verwijzingen naar de gebruikte sleutel. |

#### Registratiemodel

Elke registratie heeft een UUID, een URA, een bronsysteem-identificatie, een interne beschermde persoonsreferentie, een sleutelverwijzing en een aanmaaktijd. De combinatie van URA, persoonsreferentie en bronsysteem is uniek. Een herhaalde registratie behoudt de bestaande UUID en aanmaaktijd.

De URA identificeert de zorgaanbieder. `source_id` identificeert een bronsysteem bij die zorgaanbieder en is een ondoorzichtige identificatie, bijvoorbeeld `EHR-SYS-001`. Gebruik overal dezelfde waarde: bij de bronautorisatie, in het OAuth-token en in `List.source.identifier.value`. De FHIR-namespace hiervoor is `urn:ietf:rfc:3986`.

#### Toegang per operatie

Een scope bepaalt welke operatie de client mag uitvoeren. Voor aanmaken en verwijderen is ook een geautoriseerde `source_id` nodig. Een FHIR-aanmaakverzoek moet zowel dezelfde URA als dezelfde bron bevatten als de geauthenticeerde context. Verwijderen wordt altijd beperkt tot die URA en bron.

Bij lezen is het onderscheid tussen lokaliseren en eigen registraties raadplegen van belang. Lokalisatie zoekt voor één persoon over alle zorgaanbieders. Eigen registraties lezen is beperkt tot de URA van de aanroeper; een opgegeven bronfilter moet overeenkomen met diens `source_id`. Zonder bronfilter kunnen leesoperaties meerdere bronsystemen van dezelfde URA teruggeven. De [zoekmatrix](#zoekgedrag) beschrijft dit per verzoek.

#### Logging en beheer

De NVI registreert onder meer aanmaak, herhaalde registratie, zoekacties, lokalisaties, verwijderingen en geweigerde toegang. Loguitvoer heeft afzonderlijke kanalen voor applicatiebeheer, securitymonitoring en inzage. Sleutelmetadata wordt intern beheerd; clients hoeven geen NVI-sleutellabel of opslagmechanisme mee te sturen.

{{% notice title="Verantwoordelijkheid van de zorgaanbieder" type="warn" %}}

De NVI autoriseert op organisatieniveau. De dienst stelt geen behandelrelatie of toestemming vast en identificeert niet de individuele zorgverlener achter een verzoek. De aangesloten zorgaanbieder verzorgt deze controles in het eigen proces en toegangsbeheer.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### OPRF-invoer voor de NVI {#api-oprf-invoer}

Vraag de voor de NVI bestemde JWE aan via de [PRS-evaluatiestap](/integration/prs/#evaluatie-aanvragen). Gebruik `recipientOrganization=oin:<oin-nvi>` en de voor deze aansluiting geregistreerde `recipientScope`, bijvoorbeeld `nationale-verwijsindex`. Het OIN van de NVI heeft 20 posities en identificeert de ontvanger; dit is een andere identificatie dan de URA waarvoor de client handelt.

Gebruik exact dezelfde ontvanger en scope bij de HKDF-afleiding en bij de PRS-aanvraag. Registreren en lokaliseren moeten binnen hetzelfde PRS-domein plaatsvinden om dezelfde persoon te kunnen matchen. Gebruik de JWE ongewijzigd en houd de bijbehorende blind factor bij elkaar.

| Koppelvlak | JWE uit de PRS | Blind factor |
| --- | --- | --- |
| FHIR | `evaluated_output` in het verpakte identifier-token | `blind_factor` in datzelfde token, Base64url met padding |
| Core JSON | `pseudonym` | `oprf_key`, Base64url met padding |

#### Identifier opbouwen {#identifier-opbouwen}

De FHIR-identifier gebruikt systeem `http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier`. De waarde is Base64url zonder padding van een UTF-8 JSON-object:

```json
{
  "evaluated_output": "<jwe-uit-prs>",
  "blind_factor": "<base64url-blind-factor>"
}
```

Encodeer eerst de ruwe blind factor als Base64url **met** padding, serialiseer het object en encodeer daarna het volledige JSON-object als Base64url **zonder** padding. De JWE krijgt geen extra Base64-laag binnen het object.

{{% tabs %}}

{{% tab "PHP" %}}

```php
// $jwe en $rawBlind komen uit de PRS OPRF-flow.
$blindFactor = sodium_bin2base64($rawBlind, SODIUM_BASE64_VARIANT_URLSAFE);
$identifierJson = json_encode([
    'evaluated_output' => $jwe,
    'blind_factor' => $blindFactor,
], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
$identifierValue = rtrim(strtr(base64_encode($identifierJson), '+/', '-_'), '=');
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import base64
import json

# jwe en raw_blind komen uit de PRS OPRF-flow.
blind_factor = base64.urlsafe_b64encode(raw_blind).decode("ascii")
identifier_json = json.dumps(
    {"evaluated_output": jwe, "blind_factor": blind_factor},
    separators=(",", ":"),
)
identifier_value = base64.urlsafe_b64encode(
    identifier_json.encode("utf-8")
).rstrip(b"=").decode("ascii")
```

{{% /tab %}}

{{% /tabs %}}

Gebruik deze waarde bij registratie in `subject.identifier.value` en bij zoeken in `subject:identifier` als `<system>|<identifier-value>`. Laat de HTTP-client de queryparameters URL-encoderen.

{{% /card %}}

{{% anchor id="oauth-token" %}}

{{% card %}}

### OAuth-token voor NVI

De NVI gebruikt een OAuth 2.0 Authorization Service. Vraag een token aan met mTLS en de vijf verplichte formuliervelden `grant_type`, `scope`, `target_audience`, `organization_external_id` en `client_id`. `organization_external_id` is de URA waarvoor de client handelt. `client_id` is de UUID van de geregistreerde clientautorisatie. Stuur voor `nvi:create`, `nvi:read` en `nvi:delete` ook de bijbehorende `source_id` mee. Alleen `nvi:localize` kan zonder bron worden aangevraagd.

Vervang `{{% service "oauth.url_placeholder" %}}` door de basis-URL van de OAuth-service, inclusief `https://` en een eventuele versieprefix, zonder afsluitende slash.

{{< endpoint method="POST" oauth=true path="/token" >}}

#### Parameters

{{% oauth-parameters %}}

#### Scopes

De voorbeelden gebruiken `{{% service "oauth.default_scope" %}}`. Vraag voor de gewenste operatie de bijbehorende scope aan; meerdere scopes worden met spaties gescheiden.

<div class="oauth-scopes-wrap" tabindex="0" role="region" aria-label="Scopes voor NVI">

| Scope | Omschrijving |
| --- | --- |
| `nvi:create` | Registraties aanmaken; een geautoriseerde `source_id` is vereist. |
| `nvi:delete` | Registraties verwijderen binnen de geautoriseerde URA en bron; `source_id` is vereist. |
| `nvi:read` | Eigen registraties lezen, FHIR op ID lezen en FHIR-zoekvragen die geen algemene lokalisatie zijn; vraag het token aan met `source_id`. |
| `nvi:localize` | Lokaliseren over zorgaanbieders via `POST /localize` of een FHIR-zoekvraag met uitsluitend `subject:identifier`. |

</div>

Een `source_id` wordt gekoppeld aan de clientautorisatie en moet exact overeenkomen met de geregistreerde bron. Voor een FHIR-zoekvraag met een bronfilter is diezelfde bronautorisatie nodig.

{{% /card %}}

{{% card %}}

### Token ophalen {#oauth-token-ophalen}

Dit integratievoorbeeld gebruikt `grant_type=client_credentials` en een PKIoverheid-certificaat. De PHP-voorbeelden hieronder gebruiken dezelfde `curlRequest`-helper en certificaatvariabelen. Gebruik per API-operatie een token met de bijbehorende scope.

Vul `{{% service "oauth.url_placeholder" %}}` in met de OAuth-basis-URL voordat je de cURL-, PHP- of Python-voorbeelden uitvoert. Vervang `{{% service "oauth.target_audience_example" %}}` door de exact geregistreerde audience van de NVI API; dit is geen pad naar een afzonderlijke operatie.

{{% tabs %}}

{{% tab "cURL" %}}

```bash
curl -s -X POST \
  --cert client-cert.pem \
  --key  client-key.pem \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope={{% service "oauth.default_scope" %}}" \
  --data-urlencode "target_audience={{% service "oauth.target_audience_example" %}}" \
  --data-urlencode "organization_external_id={{% service "oauth.organization_id_example" %}}" \
  --data-urlencode "client_id=<client-id>" \
{{% oauth-source "curl" %}}  "{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token" \
  | python3 -m json.tool
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
$certFile = 'client-cert.pem';
$keyFile = 'client-key.pem';

function curlRequest(string $certFile, string $keyFile, string $url, array $options): array
{
    $handle = curl_init($url);
    curl_setopt_array($handle, $options + [
        CURLOPT_SSLCERT => $certFile,
        CURLOPT_SSLKEY => $keyFile,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
    ]);
    $body = curl_exec($handle);
    if ($body === false) {
        throw new RuntimeException(curl_error($handle));
    }
    $status = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    return [$status, $body];
}

[$status, $body] = curlRequest($certFile, $keyFile, '{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token', [
    CURLOPT_POST       => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type'        => 'client_credentials',
        'scope'             => '{{% service "oauth.default_scope" %}}',
        'target_audience'   => '{{% service "oauth.target_audience_example" %}}',
        'organization_external_id' => '{{% service "oauth.organization_id_example" %}}',
        'client_id' => '<client-id>',
{{% oauth-source "php" %}}    ]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
]);
if ($status !== 200) {
    throw new RuntimeException('Tokenaanvraag mislukt: HTTP ' . $status . ' ' . $body);
}
$jwtNvi = json_decode($body, true, 512, JSON_THROW_ON_ERROR)['access_token'];
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import requests

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")

resp = session.post(
    "{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token",
    data={
        "grant_type":      "client_credentials",
        "scope":           "{{% service "oauth.default_scope" %}}",
        "target_audience": "{{% service "oauth.target_audience_example" %}}",
        "organization_external_id": "{{% service "oauth.organization_id_example" %}}",
        "client_id": "<client-id>",
{{% oauth-source "python" %}}    },
    timeout=30,
)
resp.raise_for_status()
token = resp.json()["access_token"]
```

{{% /tab %}}

{{% /tabs %}}

Een succesvolle aanvraag geeft HTTP `200` met een JSON-antwoord:

```json
{
  "token_type": "Bearer",
  "access_token": "<access-token>",
  "scope": "nvi:read"
}
```

Zet voor de cURL-voorbeelden het ontvangen `access_token` in de variabele `TOKEN`. Gebruik het token in `Authorization: Bearer <access-token>`. De response bevat geen `expires_in`; de geldigheidsduur staat in de `iat`- en `exp`-claims van het token. Vraag na afloop een nieuw token aan.

De [algemene OAuth-uitleg](/integration/oauth/#metadata-en-tokenverificatie) beschrijft hoe de infrastructuur het token controleert.

{{% /card %}}

{{% /anchor %}}

{{% card %}}

### Lokalisatie registreren (`POST /fhir/List`) {#lokalisatie-registreren}

Registreer een lokalisatie door een FHIR `List`-resource als `application/fhir+json` te sturen. De identificerende OPRF-uitvoer staat in `subject.identifier.value`; volg hiervoor de instructies voor [de identifier opbouwen](#identifier-opbouwen). De List bevat daarnaast de custodian-extensie, bronreferentie, status, mode en `emptyReason`. Gebruik een token met `nvi:create` en een geautoriseerde `source_id`. De URA in de custodian-extensie en de bron in `source.identifier.value` moeten overeenkomen met de tokencontext.

{{% notice title="Verplichte List-velden" type="tip" %}}

Stuur `resourceType=List`, de custodian-extensie met URA, `subject.identifier`, `source.identifier`, `status`, `mode` en `emptyReason`. De voorbeelden gebruiken `status=current`, `mode=working` en `emptyReason.coding.code=withheld`.

De input accepteert voor `status` ook `retired` en `entered-in-error`, en voor `mode` ook `snapshot` en `changes`. Deze waarden worden niet als registratie-eigenschap opgeslagen: de output gebruikt altijd `current`, `working` en `withheld`. Gebruik de verwijderoperatie om beschikbaarheid in te trekken.

{{% /notice %}}

{{% tabs %}}

{{% tab "cURL" %}}

```bash
curl -s -X POST \
  --cert client-cert.pem \
  --key  client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/fhir+json" \
  -H "Accept: application/fhir+json" \
  -d '{
    "resourceType": "List",
    "extension": [{
      "url": "http://minvws.github.io/generiekefuncties-docs/StructureDefinition/nl-gf-localization-custodian",
      "valueReference": {
        "identifier": {
          "system": "http://fhir.nl/fhir/NamingSystem/ura",
          "value": "<custodian-ura>"
        }
      }
    }],
    "subject": {
      "identifier": {
        "system": "http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier",
        "value": "<identifier-value>"
      }
    },
    "source": {
      "identifier": {
        "system": "urn:ietf:rfc:3986",
        "value": "<bron-id>"
      },
      "type": "Device"
    },
    "status": "current",
    "mode": "working",
    "emptyReason": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
        "code": "withheld"
      }]
    }
  }' \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List"
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
// Bouw $identifierValue op zoals hierboven beschreven.
$resource = json_encode([
    'resourceType' => 'List',
    'extension' => [[
        'url' => 'http://minvws.github.io/generiekefuncties-docs/StructureDefinition/nl-gf-localization-custodian',
        'valueReference' => [
            'identifier' => [
                'system' => 'http://fhir.nl/fhir/NamingSystem/ura',
                'value'  => $custodianUra,
            ],
        ],
    ]],
    'subject' => [
        'identifier' => [
            'system' => 'http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier',
            'value'  => $identifierValue,
        ],
    ],
    'source' => [
        'identifier' => [
            'system' => 'urn:ietf:rfc:3986',
            'value'  => $sourceId,
        ],
        'type' => 'Device',
    ],
    'status' => 'current',
    'mode' => 'working',
    'emptyReason' => [
        'coding' => [[
            'system' => 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
            'code' => 'withheld',
        ]],
    ],
]);

[$status, $body] = curlRequest($certFile, $keyFile, '{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List', [
    CURLOPT_POST       => true,
    CURLOPT_POSTFIELDS => $resource,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $jwtNvi,
        'Content-Type: application/fhir+json',
        'Accept: application/fhir+json',
    ],
]);
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import requests

# Bouw identifier_value op zoals hierboven beschreven.
NVI_BASE_URL  = "{{% service "url_placeholder" %}}{{% service "base_path" %}}"
CUSTODIAN_URA = "<custodian-ura>"
SOURCE_ID     = "<bron-id>"

resource = {
    "resourceType": "List",
    "extension": [{
        "url": "http://minvws.github.io/generiekefuncties-docs/StructureDefinition/nl-gf-localization-custodian",
        "valueReference": {
            "identifier": {
                "system": "http://fhir.nl/fhir/NamingSystem/ura",
                "value": CUSTODIAN_URA,
            }
        }
    }],
    "subject": {
        "identifier": {
            "system": "http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier",
            "value": identifier_value,
        }
    },
    "source": {
        "identifier": {
            "system": "urn:ietf:rfc:3986",
            "value": SOURCE_ID,
        },
        "type": "Device",
    },
    "status": "current",
    "mode": "working",
    "emptyReason": {
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
            "code": "withheld",
        }]
    },
}

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")
resp = session.post(
    f"{NVI_BASE_URL}/fhir/List",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/fhir+json",
        "Accept":         "application/fhir+json",
    },
    json=resource,
    timeout=30,
)
resp.raise_for_status()
```

{{% /tab %}}

{{% /tabs %}}

{{% /card %}}

{{% card %}}

#### Antwoord op registratie

Een nieuwe registratie geeft HTTP `201`; een bestaande combinatie van persoon, URA en bron geeft HTTP `200` met de bestaande registratie. Beide antwoorden hebben `Content-Type: application/fhir+json` en bevatten een `List` zonder `subject`. Sla de UUID uit `id` op voor latere lees- of verwijderacties.

```json
{
  "id": "1a2b3c4d-0000-4000-8000-000000000001",
  "resourceType": "List",
  "extension": [{
    "url": "http://minvws.github.io/generiekefuncties-docs/StructureDefinition/nl-gf-localization-custodian",
    "valueReference": {
      "identifier": {
        "system": "http://fhir.nl/fhir/NamingSystem/ura",
        "value": "12345678"
      }
    }
  }],
  "source": {
    "identifier": {
      "system": "urn:ietf:rfc:3986",
      "value": "EHR-SYS-001"
    },
    "type": "Device"
  },
  "status": "current",
  "mode": "working",
  "emptyReason": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
      "code": "withheld"
    }]
  }
}
```

{{% /card %}}

{{% card %}}

### Lokalisaties opvragen (`GET /fhir/List`) {#lokalisaties-opvragen}

Een zoekvraag geeft HTTP `200` met een FHIR `Bundle` van type `searchset`. Elke `entry.resource` is een `List` met dezelfde vorm als het [registratieantwoord](#lokalisatie-registreren). `total` is het aantal gevonden registraties. Geen resultaat geeft `total: 0` en `entry: []`.

#### Zoekgedrag {#zoekgedrag}

De combinatie van parameters bepaalt zowel de scope als de begrenzing van het resultaat. Een bronfilter toevoegen verandert een algemene lokalisatie in het raadplegen van eigen registraties.

| Parameters | Vereiste scope | Resultaat |
| --- | --- | --- |
| Alleen `subject:identifier` | `nvi:localize` | Alle registraties voor deze persoon, over alle zorgaanbieders en bronsystemen. |
| `subject:identifier` en `source:identifier` | `nvi:read` | Registraties voor deze persoon binnen de eigen URA en de opgegeven, geautoriseerde bron. |
| Alleen `source:identifier` | `nvi:read` | Alle registraties binnen de eigen URA en de opgegeven, geautoriseerde bron. |
| Geen parameters | `nvi:read` | Alle registraties binnen de eigen URA, over de bronsystemen van die URA. |

| Parameter | Vorm | Betekenis |
| --- | --- | --- |
| `subject:identifier` | `<system>\|<identifier-value>` | Het [verpakte OPRF-token](#identifier-opbouwen) met het NVI-identifiersysteem. |
| `source:identifier` | `urn:ietf:rfc:3986\|EHR-SYS-001` | Bronfilter; de waarde moet overeenkomen met de geauthenticeerde `source_id`. |

Een losse waarde zonder systeem wordt ook geaccepteerd met het bijbehorende vaste systeem. Gebruik in integraties de expliciete vorm `system|waarde`. Een leeg systeem of een lege waarde wordt behandeld als een ontbrekend filter. Controleer daarom vóór verzending dat iedere bedoelde filterwaarde gevuld is.

Andere zoekparameters worden afgewezen met HTTP `422`. Er zijn geen filters voor zorgcontext of organisatietype en geen pagineringsparameters; ook `code`, `_count` en `_offset` horen niet bij dit contract.

{{% tabs %}}

{{% tab "cURL" %}}

Zet de opgebouwde identifier in `IDENTIFIER_VALUE`. Dit voorbeeld lokaliseert over zorgaanbieders en gebruikt een token met `nvi:localize`.

```bash
curl -sS --get \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  --data-urlencode "subject:identifier=http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier|$IDENTIFIER_VALUE" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List"
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
// Gebruik $identifierValue uit de stap 'Identifier opbouwen'.
$system = 'http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier';
$query = http_build_query([
    'subject:identifier' => $system . '|' . $identifierValue,
], '', '&', PHP_QUERY_RFC3986);

[$status, $body] = curlRequest($certFile, $keyFile,
    '{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List?' . $query,
    [
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $jwtNvi,
            'Accept: application/fhir+json',
        ],
    ]
);
if ($status !== 200) {
    throw new RuntimeException('NVI-zoekvraag mislukt: HTTP ' . $status . ' ' . $body);
}
$bundle = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
foreach ($bundle['entry'] as $entry) {
    $resource = $entry['resource'];
    echo $resource['id'] . "\n";
}
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import requests

# Gebruik identifier_value uit de stap 'Identifier opbouwen'.
system = "http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier"
session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")
resp = session.get(
    "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List",
    params={"subject:identifier": f"{system}|{identifier_value}"},
    headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/fhir+json",
    },
    timeout=30,
)
resp.raise_for_status()
bundle = resp.json()
for entry in bundle["entry"]:
    print(entry["resource"]["id"])
```

{{% /tab %}}

{{% /tabs %}}

Voor eigen registraties van één bronsysteem gebruik je `nvi:read` en voeg je `source:identifier=urn:ietf:rfc:3986|<bron-id>` toe. Laat `subject:identifier` weg om alle registraties van dat eigen bronsysteem op te vragen.

{{% /card %}}

{{% card %}}

### Lokalisatie ophalen op ID {#lokalisatie-ophalen}

{{< endpoint method="GET" path="/fhir/List/{id}" >}}

Gebruik een token met `nvi:read` en de UUID uit het registratie- of zoekantwoord. De registratie moet bij de URA van de aanroeper horen. Deze leesoperatie beperkt niet op bronsysteem: een registratie van een ander bronsysteem binnen dezelfde URA kan op ID worden opgehaald. Een ontbrekende registratie of een registratie bij een andere URA geeft HTTP `404`.

```bash
curl -sS \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List/<id>"
```

Een succesvolle aanvraag geeft HTTP `200` met de `List`, zonder `subject`.

{{% /card %}}

{{% card %}}

### Lokalisatie verwijderen (`DELETE /fhir/List/<id>`) {#lokalisatie-verwijderen}

Gebruik een token met `nvi:delete` en een geautoriseerde `source_id`. Alleen een registratie met dezelfde URA en bron als de aanroeper wordt verwijderd.

```bash
curl -sS -X DELETE \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List/<id>"
```

Verwijderen geeft HTTP `200` met een FHIR `OperationOutcome`. Een ontbrekende registratie of een registratie buiten de geautoriseerde URA en bron geeft HTTP `404`.

#### Meerdere registraties verwijderen

{{< endpoint method="DELETE" path="/fhir/List" >}}

Dezelfde zoekparameters als bij GET zijn toegestaan. De verwijdering blijft altijd beperkt tot de geautoriseerde URA en `source_id`. Met `subject:identifier` verwijder je de registratie voor die persoon binnen de eigen bron. Een expliciet `source:identifier` moet dezelfde bron bevatten als de tokencontext.

```bash
curl -sS -X DELETE --get \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  --data-urlencode "subject:identifier=http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier|$IDENTIFIER_VALUE" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List"
```

{{% notice title="Verwijderen zonder persoonsfilter" type="warn" %}}

Een DELETE zonder `subject:identifier` verwijdert **alle registraties van de geautoriseerde URA en bron**. Dit geldt ook bij een leeg persoonsfilter. Bouw voor het verwijderen van één persoon altijd een volledige, niet-lege identifier op.

{{% /notice %}}

Bij één of meer verwijderde registraties volgt HTTP `200` met een `OperationOutcome` dat het aantal vermeldt. Zonder overeenkomende registraties volgt HTTP `404` met een `OperationOutcome`.

{{% /card %}}

{{% card %}}

### FHIR Bundle verwerken {#fhir-bundles}

{{< endpoint method="POST" path="/fhir" >}}

Stuur een FHIR `Bundle` als `application/json` met een niet-lege `entry`-lijst. Iedere entry bevat een `request` met `method` en een URL relatief aan de FHIR-basis. Ondersteund zijn `POST List`, `GET List/{id}`, `GET List?<zoekparameters>`, `DELETE List/{id}` en `DELETE List?<zoekparameters>`. Een POST-entry bevat daarnaast de volledige `List` in `resource`.

Voorbeeld: twee eigen registraties op ID ophalen met `nvi:read`:

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "request": {
        "method": "GET",
        "url": "List/1a2b3c4d-0000-4000-8000-000000000001"
      }
    },
    {
      "request": {
        "method": "GET",
        "url": "List/1a2b3c4d-0000-4000-8000-000000000002"
      }
    }
  ]
}
```

Sla de JSON op als `bundle.json` en verstuur deze:

```bash
curl -sS -X POST \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary @bundle.json \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir"
```

De scope-, URA- en broncontroles gelden per entry zoals bij de afzonderlijke operaties. URL-encodeer zoekparameters ook binnen `request.url`.

De gehele aanvraag geeft HTTP `200` met een JSON-Bundle van type `searchset` zodra de buitenste structuur is geaccepteerd. Controleer voor **iedere** entry `response.status` en `response.outcome`: een HTTP `200` voor de Bundle betekent niet dat alle entries geslaagd zijn. Een nieuwe registratie heeft entry-status `201`, een bestaande registratie `200`. Fouten kunnen onder meer entry-status `403`, `404` of `422` hebben.

Entries worden achtereenvolgens verwerkt en hebben geen gezamenlijke rollback. Ook met `type=transaction` kunnen eerdere wijzigingen blijven bestaan als een latere entry mislukt. Gebruik dit koppelvlak daarom niet wanneer alle wijzigingen samen atomair moeten slagen.

{{% /card %}}

{{% card %}}

### FHIR-capabilities opvragen {#fhir-metadata}

{{< endpoint method="GET" path="/fhir/metadata" >}}

Dit endpoint geeft HTTP `200` met een FHIR `CapabilityStatement` en `Content-Type: application/fhir+json`. Stuur het OAuth-token mee; de metadata-route gebruikt dezelfde geauthenticeerde API-toegang. Er is geen afzonderlijke operatiescope voor dit endpoint.

```bash
curl -sS \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/metadata"
```

{{% /card %}}

{{% card %}}

### Core JSON API {#core-api}

De Core API biedt dezelfde registratie- en lokalisatiefuncties met JSON-berichten. Gebruik `Content-Type: application/json` voor POST en `Accept: application/json`. De invoer bevat de JWE uit de PRS als `pseudonym` en de Base64url-gecodeerde blind factor met padding als `oprf_key`; het verpakte FHIR-identifier-token wordt hier niet gebruikt.

| Methode en pad | Invoer | Scope | Succesantwoord |
| --- | --- | --- | --- |
| `POST /registrations` | JSON met `pseudonym` en `oprf_key` | `nvi:create` en `source_id` | `201` nieuw of `200` bestaand; één registratie. |
| `GET /registrations` | Verplichte queryparameters `pseudonym` en `oprf_key` | `nvi:read` | `200`; registraties voor de persoon binnen de eigen URA, over diens bronsystemen. |
| `DELETE /registrations` | Verplichte queryparameters `pseudonym` en `oprf_key` | `nvi:delete` en `source_id` | `204`, zonder body; beperkt tot de eigen URA en bron. |
| `POST /localize` | JSON met `pseudonym` en `oprf_key` | `nvi:localize` | `200`; JSON-array van registraties voor de persoon over alle zorgaanbieders. |

URA en bron worden voor aanmaken en verwijderen uit de geauthenticeerde context gehaald. Stuur ze niet als extra bodyvelden. Er is geen `care_context`-parameter.

#### Registreren en lokaliseren

Sla de invoer op als `nvi-input.json`:

```json
{
  "pseudonym": "<jwe-uit-prs>",
  "oprf_key": "<base64url-blind-factor>"
}
```

Registreer met `nvi:create`:

```bash
curl -sS -X POST \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary @nvi-input.json \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/registrations"
```

Een registratie heeft precies deze velden:

```json
{
  "ura_number": "12345678",
  "source_id": "EHR-SYS-001",
  "created_at": "2026-10-22T10:00:00"
}
```

De URA wordt als string van acht cijfers teruggegeven. Een herhaalde aanmaak behoudt de bestaande aanmaaktijd. De Core-response bevat geen registratie-UUID.

Om te lokaliseren gebruik je dezelfde JSON, een token met `nvi:localize` en pad `/localize`. Het antwoord is direct een array van bovenstaande registratieobjecten, zonder `results`-wrapper; bij geen resultaat is het `[]`.

#### Eigen registraties opvragen

Zet de JWE en Base64url-blind factor in `JWE` en `BLIND_FACTOR`. Laat cURL de queryparameters encoderen:

```bash
curl -sS --get \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  --data-urlencode "pseudonym=$JWE" \
  --data-urlencode "oprf_key=$BLIND_FACTOR" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/registrations"
```

Het antwoord bevat `registrations`, een array van registratieobjecten, en `total`. Zonder overeenkomsten is dit `{"registrations": [], "total": 0}`. Deze Core-operatie filtert op de eigen URA en de opgegeven persoon; zij past geen bronfilter toe.

Voor verwijderen gebruik je dezelfde queryparameters met `-X DELETE --get` en een token met `nvi:delete`. Het antwoord is HTTP `204` met een lege body, ook als er geen registratie van deze persoon binnen de geautoriseerde URA en bron bestond. Verwijderacties voor alle personen van één bron verlopen via de [FHIR-verwijderoperatie](#lokalisatie-verwijderen).

{{% /card %}}

{{% card %}}

### Foutafhandeling en service-informatie {#foutafhandeling}

FHIR-fouten bevatten een `OperationOutcome` met één of meer items in `issue`. Lees `issue[].code` en `issue[].details.text` voor de oorzaak. Bij schemavalidatiefouten heet het resourceveld `resourceType`; bij overige gemapte fouten en zelfstandige DELETE-antwoorden heet dit veld `resource_type`. Houd bij het verwerken van deze antwoorden rekening met beide vormen. Core-fouten zijn JSON: gemapte fouten geven een JSON-string, validatiefouten een lijst met veldfouten en onverwachte fouten een object met `error`.

| HTTP-status | Betekenis |
| --- | --- |
| `400` | Ongeldige inhoud of invoer die niet verwerkt kan worden. |
| `401` | Ongeldige authenticatie of doelgroep. |
| `403` | Vereiste scope ontbreekt, bron komt niet overeen of de URA is niet toegestaan. |
| `404` | Registratie niet gevonden binnen het toegestane bereik, of FHIR-verwijdering zonder overeenkomsten. |
| `409` | Conflicterende operatie. Een herhaalde geldige registratie geeft `200`. |
| `422` | Ontbrekende of ongeldige velden, onbekende FHIR-zoekparameter of onleesbaar FHIR-identifier-token. |
| `500` | Onverwachte fout bij verwerking of een afhankelijke dienst. |
| `503` | Geen eenduidige actieve cryptografische sleutel beschikbaar. |

Voorbeeld van een niet-gevonden registratie:

```json
{
  "resource_type": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "not-found",
    "details": {"text": "Record not found"}
  }]
}
```

Behandel een lege zoekuitkomst als een geldig HTTP `200`-antwoord. Controleer bij Bundles daarnaast de status per entry. Een ontbrekende scope wordt niet opgelost door hetzelfde token opnieuw te gebruiken: vraag een token aan met de juiste geregistreerde autorisatie.

De algemene routes `GET /version.json` en `GET /health` zijn beschikbaar zonder OAuth-token. `GET /` toont een servicebanner en vereist via de API-gateway een OAuth-token. `version.json` geeft versie- en buildinformatie plus een `features`-lijst voor de betreffende omgeving. Gebruik ook voor deze informatieroutes de mTLS-verbinding van de aansluiting. Gebruik deze routes om te controleren welke NVI-instantie je bereikt.

{{% /card %}}

{{< page-nav >}}
[← PRS](/integration/prs/) [← Terug naar overzicht](/integration/)
{{< /page-nav >}}

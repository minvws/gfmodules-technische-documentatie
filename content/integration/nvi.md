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
        title: "Ontwerpprincipes"
  - id: api-oprf-invoer
    title: "OPRF-invoer"
  - id: oauth-token
    title: "OAuth: parameters en scopes"
    children:
      - id: oauth-token-ophalen
        title: "Token ophalen"
  - id: lokalisatie-registreren
    title: "Lokalisatie registreren"
  - id: lokalisaties-opvragen
    title: "Lokalisaties opvragen"
  - id: lokalisatie-verwijderen
    title: "Lokalisatie verwijderen"
  - id: fhir-metadata
    title: "FHIR-capabilities opvragen"
heading: "📑 NVI — Nationale Verwijs Index"
service: nvi
---

Volg eerst de [aansluitinstructies](/integration/aansluiten/) voor het PKIoverheid-certificaat, de registratie en de mTLS-verbinding. Gebruik daarna een [OAuth-token van de NVI](#oauth-token) voor het API-basispad `{{% service "base_path" %}}`.

{{% notice title="Endpoint invullen" %}}

Vervang `{{% service "url_placeholder" %}}` door het NVI-serveradres, inclusief `https://` en zonder afsluitende slash. Het API-basispad `{{% service "base_path" %}}` blijft daarachter staan.

{{% /notice %}}

{{% card %}}

### Wat de NVI doet {#wat-de-nvi-doet}

De NVI registreert waar gegevens over een persoon beschikbaar zijn: bij welke zorgaanbieder, voor welke zorgcontext en, in het ontwerp, bij welk bronsysteem. De dienst bevat geen zorginhoud.

{{% columns %}}

{{% column %}}

#### Bron registreert beschikbaarheid

Een bron registreert dat zij gegevens over een persoon beschikbaar heeft voor een bepaalde zorgcontext. De registratie is bedoeld om herhaalbaar en beheersbaar te zijn.

{{% /column %}}

{{% column %}}

#### Raadpleger lokaliseert bronnen

Een raadpleger zoekt vervolgens welke bronnen gegevens beschikbaar hebben voor die persoon en zorgcontext. De uitkomst is een lijst van bronnen, geen medische inhoud.

{{% /column %}}

{{% /columns %}}

{{% /card %}}

{{% card %}}

### Privacybeschermde matching {#concept-matching}

{{% steps %}}

{{% step number="1" %}}

#### Voor NVI bestemde PRS-uitvoer ophalen

De client laat het persoonsnummer lokaal blinderen en ontvangt via de PRS een voor de NVI versleutelde JWE, samen met de eigen deblinderingssleutel.

{{% /step %}}

{{% step number="2" %}}

#### Registreren of lokaliseren

De client biedt de JWE, deblinderingssleutel en zorgcontext aan de NVI aan, samen met de gegevens die voor de gekozen operatie nodig zijn.

{{% /step %}}

{{% step number="3" %}}

#### Intern verwerken

De NVI ontsleutelt de JWE in de beschermde cryptoverwerking, controleert de zorgcontext, deblindeert het PRS-pseudoniem en leidt daaruit een interne HMAC-hash af.

{{% /step %}}

{{% step number="4" %}}

#### Alleen minimale uitkomst

De NVI gebruikt de interne hash voor opslag en matching met zorgaanbieder- en zorgcontextgegevens. API-responses geven het pseudoniem of de hash nooit terug.

{{% /step %}}

{{% /steps %}}

{{% notice title="Geen BSN in de NVI" %}}

De NVI ontvangt of bewaart geen BSN. Het PRS-pseudoniem wordt alleen tijdelijk binnen de cryptoverwerking afgeleid, niet opgeslagen of geretourneerd; voor lookup en opslag gebruikt de NVI een afgeleide interne hash.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### Ontwerpprincipes en afbakening {#concept-ontwerpprincipes}

{{% columns %}}

{{% column %}}

#### Zorgcontext als begrenzing

Het ontwerp richt registratie en lokalisatie op een zorgcontext. Zorgcontext-gebonden pseudoniemen zijn een voorstel; de API-parameters blijven leidend totdat het API-contract wijzigt.

{{% /column %}}

{{% column %}}

#### Beheerde toegang en bronisolatie

Het ontwerp voorziet mTLS, OAuth 2.0 en autorisatie per organisatie, URA en bron. Een bron mag alleen de eigen registraties beheren.

{{% /column %}}

{{% column %}}

#### Dataminimalisatie

De NVI bewaart alleen de gegevens die nodig zijn om beschikbaarheid te lokaliseren. Pseudoniemen en interne hashes worden niet in API-responses teruggegeven.

{{% /column %}}

{{% column %}}

#### Bescherming en toezicht

Het ontwerp voorziet onder meer HSM-ondersteunde sleutelverwerking, rate limiting, auditlogging en monitoring. Deze maatregelen zijn nog ontwerp- en implementatiewerk.

{{% /column %}}

{{% /columns %}}

{{% notice title="Technische autorisatie is geen behandelrelatie" type="warn" %}}

De NVI kan niet vaststellen of een raadpleging binnen een behandelrelatie plaatsvindt. Ook toestemming wordt niet door de NVI vastgesteld; die verantwoordelijkheden liggen bij de aangesloten zorgaanbieders en de verdere governance-uitwerking.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### OPRF-invoer voor de NVI {#api-oprf-invoer}

De Nationale Verwijs Index ontvangt geen BSN. De client verpakt de uitvoer van de PRS (`jwe` + URL-safe Base64-gecodeerde `blind_factor`) in de waarde van `subject.identifier` of `subject:identifier`. Het ontwerp beschrijft dat de NVI het pseudoniem alleen binnen de cryptoverwerking afleidt voor interne matching. Het beoogde responsmodel retourneert de JWE, het pseudoniem of een interne hash niet; raadpleeg de [FHIR-capabilities](#fhir-metadata) voor het responsecontract. De integratievoorbeelden gebruiken mTLS en een OAuth-token.

Vraag de voor de NVI bestemde uitvoer aan via de [PRS-evaluatiestap](/integration/prs/#evaluatie-aanvragen). Gebruik daarbij `recipientOrganization` = `oin:<20-cijferig-oin-nvi>` en `recipientScope` = `nationale-verwijsindex`. Vul het 20-cijferige OIN van de NVI in. Gebruik deze waarden zowel bij de HKDF-afleiding als bij de PRS-aanvraag.

{{% /card %}}

{{% anchor id="oauth-token" %}}

{{% card %}}

### OAuth-token voor NVI

NVI heeft een eigen OAuth 2.0 Authorization Service. Gebruik dit endpoint om een token voor de NVI API op te halen. Stuur de vier verplichte formuliervelden `grant_type`, `scope`, `target_audience` en `organization_id` mee. De voorbeelden hieronder gebruiken mTLS en een voorbeeldscope.

Vervang `{{% service "oauth.url_placeholder" %}}` door het serveradres van de OAuth-service, inclusief `https://` en zonder afsluitende slash.

{{< endpoint label="Token" oauth=true path="/token" >}}

#### Parameters en scopes

{{% oauth-parameters %}}

De voorbeelden gebruiken `{{% service "oauth.default_scope" %}}`.

{{% /card %}}

{{% card %}}

### Token ophalen {#oauth-token-ophalen}

Dit integratievoorbeeld gebruikt `grant_type=client_credentials` en een PKIoverheid-certificaat.

Vul `{{% service "oauth.url_placeholder" %}}` in met het OAuth-serveradres voordat je de cURL-, PHP- of Python-voorbeelden uitvoert. Vervang `{{% service "oauth.target_audience" %}}` door de identificatie van de doelservice.

{{% tabs %}}

{{% tab "cURL" %}}

```bash
curl -s -X POST \
  --cert client-cert.pem \
  --key  client-key.pem \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope={{% service "oauth.default_scope" %}}" \
  --data-urlencode "target_audience={{% service "oauth.target_audience" %}}" \
  --data-urlencode "organization_id={{% service "oauth.organization_id_example" %}}" \
{{% oauth-source "curl" %}}  "{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token" \
  | python3 -m json.tool
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
[$status, $body] = curlRequest($certFile, $keyFile, '{{% service "oauth.url_placeholder" %}}{{% service "oauth.base_path" %}}/token', [
    CURLOPT_POST       => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type'        => 'client_credentials',
        'scope'             => '{{% service "oauth.default_scope" %}}',
        'target_audience'   => '{{% service "oauth.target_audience" %}}',
        'organization_id'   => '{{% service "oauth.organization_id_example" %}}',
{{% oauth-source "php" %}}    ]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
]);
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
        "target_audience": "{{% service "oauth.target_audience" %}}",
        "organization_id": "{{% service "oauth.organization_id_example" %}}",
{{% oauth-source "python" %}}    },
)
```

{{% /tab %}}

{{% /tabs %}}

{{% /card %}}

{{% notice title="Metadata en tokenverificatie" %}}

Gebruik de metadata en JWKS van de OAuth-service van NVI:

`{{% service "oauth.base_path" %}}/.well-known/oauth-authorization-server`\
`{{% service "oauth.base_path" %}}/jwks.json`

{{% /notice %}}

{{% /anchor %}}

{{% card %}}

### Lokalisatie registreren (`POST /fhir/List`) {#lokalisatie-registreren}

Registreer een lokalisatie door een FHIR `List`-resource als `application/fhir+json` te sturen. De identificerende OPRF-uitvoer staat in `subject.identifier.value`; volg hiervoor de instructies voor [de identifier opbouwen](#identifier-opbouwen). De List bevat daarnaast de custodian-extensie, bronreferentie, status, mode en emptyReason.

{{% notice title="Verplichte List-velden" type="tip" %}}

De velden `extension`, `status`, `mode`, `source` en `emptyReason` zijn vereist. Raadpleeg de [FHIR-capabilities](#fhir-metadata) voor het actuele FHIR-profiel.

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
// $identifierValue bevat de OPRF-uitvoer; zie de lookup-stap hieronder
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

# identifier_value bevat de OPRF-uitvoer; zie de lookup-stap hieronder
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
)
resp.raise_for_status()
```

{{% /tab %}}

{{% /tabs %}}

{{% /card %}}

{{% card %}}

### Lokalisaties opvragen (`GET /fhir/List`) {#lokalisaties-opvragen}

Zoek op persoon via de `subject:identifier` query-parameter. De waarde is een base64url-gecodeerde JSON-string die zowel de `evaluated_output` (JWE) als de `blind_factor` bevat — de NVI gebruikt die twee waarden om intern het pseudoniem te berekenen en de juiste records te vinden. Filter optioneel op de bron met de query-parameter `source:identifier`.

#### Identifier opbouwen {#identifier-opbouwen}

De identifier-waarde is: `base64url( json({"evaluated_output": <jwe>, "blind_factor": base64url(<rawBlind>)}) )`\
 Let op: `blind_factor` gebruikt URL-safe Base64, `evaluated_output` is de JWE-string ongewijzigd.

{{% tabs %}}

{{% tab "cURL" %}}

Bouw de identifier op met PHP of Python en gebruik de waarde als query-parameter.

```bash
curl -s \
  --cert client-cert.pem \
  --key  client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+json" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List?subject:identifier=http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier|<identifier-value>"
```

{{% /tab %}}

{{% tab "PHP" %}}

```php
// $jwe en $rawBlind komen uit pseudonymiseBsn() — zie PRS-integratie
$blindFactor = sodium_bin2base64($rawBlind, SODIUM_BASE64_VARIANT_URLSAFE);
$json = json_encode([
    'evaluated_output' => $jwe,
    'blind_factor'     => $blindFactor,
], JSON_UNESCAPED_SLASHES);

// base64url: geen padding, - en _ i.p.v. + en /
$identifierValue = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');

$system = 'http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier';
$query  = 'subject:identifier=' . $system . '|' . $identifierValue;

[$status, $body] = curlRequest($certFile, $keyFile,
    '{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List?' . $query,
    [
        CURLOPT_HTTPGET    => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $jwtNvi,
            'Accept: application/fhir+json',
        ],
    ]
);

$bundle = json_decode($body, true);
foreach ($bundle['entry'] ?? [] as $entry) {
    $r = $entry['resource'];
    echo $r['id'] . "\n";
}
```

{{% /tab %}}

{{% tab "Python" %}}

```python
import base64, json, requests

# jwe en raw_blind komen uit de PRS OPRF-flow — zie PRS-integratie
NVI_BASE_URL = "{{% service "url_placeholder" %}}{{% service "base_path" %}}"

identifier_json = json.dumps(
    {"evaluated_output": jwe, "blind_factor": base64.urlsafe_b64encode(raw_blind).decode()},
    separators=(",", ":"),
)
identifier_value = base64.urlsafe_b64encode(identifier_json.encode()).rstrip(b"=").decode()

system = "http://minvws.github.io/generiekefuncties-docs/NamingSystem/nvi-identifier"
query  = f"subject:identifier={system}|{identifier_value}"

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")
resp = session.get(
    f"{NVI_BASE_URL}/fhir/List?{query}",
    headers={
        "Authorization": f"Bearer {token}",
        "Accept":         "application/fhir+json",
    },
)
resp.raise_for_status()
bundle = resp.json()
for entry in bundle.get("entry", []):
    r = entry["resource"]
    print(r["id"])
```

{{% /tab %}}

{{% /tabs %}}

#### Ondersteunde zoekfilters

| Parameter | Voorbeeld | Omschrijving |
| --- | --- | --- |
| `subject:identifier` | `…/nvi-identifier\|<identifier-value>` | Filter op de identificerende OPRF-uitvoer |
| `source:identifier` | `urn:ietf:rfc:3986\|EHR-SYS-001` | Filter op bronidentificatie |

{{% /card %}}

{{% card %}}

### Lokalisatie verwijderen (`DELETE /fhir/List/<id>`) {#lokalisatie-verwijderen}

Verwijder een lokalisatie door de `id` van de registratie in het endpointpad op te nemen.

```bash
curl -s -X DELETE \
  --cert client-cert.pem \
  --key  client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/fhir/List/<id>"
```

{{% /card %}}

{{% card %}}

### FHIR-capabilities opvragen {#fhir-metadata}

Gebruik het metadata-endpoint om te zien welke FHIR-resources en interacties de NVI ondersteunt. De respons is een FHIR [`CapabilityStatement`](https://hl7.org/fhir/R4/capabilitystatement.html).

{{< endpoint method="GET" path="/fhir/metadata" >}}

{{% /card %}}

{{< page-nav >}}
[← PRS](/integration/prs/) [← Terug naar overzicht](/integration/)
{{< /page-nav >}}

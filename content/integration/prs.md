---
title: "PRS"
type: "page"
sections:
  - id: wat-de-prs-doet
    title: "Wat de PRS doet"
  - title: "Ontwerp"
    children:
      - id: concept-pseudonimiseringsstromen
        title: "Vier gebruiksmogelijkheden"
      - id: concept-ontwerpprincipes
        title: "Ontwerpprincipes"
  - id: oauth-token
    title: "OAuth: parameters en scopes"
    children:
      - id: oauth-token-ophalen
        title: "Token ophalen"
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
      - id: receiver-instellen
        title: "Ontvanger instellen"
      - id: ontsleutelen-unblinden
        title: "4. Ontsleutelen en unblinden"
heading: "👤 PRS — Pseudoniemendienst"
service: prs
---

De PRS biedt vier gebruiksmogelijkheden voor pseudonimisering. Volg eerst de [aansluitinstructies](/integration/aansluiten/) en haal daarna via OAuth een [Bearer-token](#oauth-token) op.

{{% card %}}

### Wat de PRS doet {#wat-de-prs-doet}

Met de Pseudoniemendienst (PRS) maak je organisatie-specifieke pseudoniemen op basis van een persoonsnummer, zoals het BSN. Zo kunnen organisaties over een persoon communiceren zonder het persoonsnummer onderling uit te wisselen.

Welke partij het persoonsnummer verwerkt en wie het pseudoniem ontvangt, hangt af van de gekozen gebruiksmogelijkheid.

{{% /card %}}

{{% card %}}

### Vier gebruiksmogelijkheden {#concept-pseudonimiseringsstromen}

Je kunt de PRS op vier manieren gebruiken. Hieronder staat per gebruiksmogelijkheid hoe het pseudoniem tot stand komt.

{{% columns %}}

{{% column %}}

#### Omkeerbaar pseudoniem

De PRS leidt een pseudoniem af dat zij, uitsluitend voor geautoriseerde organisaties, later kan terugrekenen naar het persoonsnummer.

{{% /column %}}

{{% column %}}

#### Niet-omkeerbaar pseudoniem

De PRS berekent een pseudoniem waarvoor geen terugrekenfunctie bestaat en bewaart geen persoonsnummer-pseudoniemkoppeling.

{{% /column %}}

{{% column %}}

#### DigiD SAML-exchange

De PRS valideert en ontsleutelt een DigiD SAML-assertion intern en retourneert een pseudoniem, zodat de aanvragende dienst het persoonsnummer niet ziet.

{{% /column %}}

{{% column %}}

#### [Geblindeerde OPRF-uitwisseling](#api-oprf-uitwisseling)

Een aanvrager blindeert het persoonsnummer lokaal. De PRS evalueert alleen die geblindeerde invoer; de ontvangende organisatie leidt als enige het pseudoniem af.

{{% /column %}}

{{% /columns %}}

{{% /card %}}

{{% card %}}

### Ontwerpprincipes {#concept-ontwerpprincipes}

{{% columns %}}

{{% column %}}

#### Context en niet-koppelbaarheid

Voor omkeerbare en niet-omkeerbare pseudoniemen bepaalt de combinatie van doelorganisatie, domein en sleutelversie de uitkomst. Binnen die context is een pseudoniem stabiel; tussen organisaties of domeinen niet onderling koppelbaar.

{{% /column %}}

{{% column %}}

#### Beschermde uitvoer

Uitvoer die voor een ontvangende organisatie bestemd is, wordt in het ontwerp voor die organisatie versleuteld. Die organisatie beheert haar eigen decryptie-private key.

{{% /column %}}

{{% column %}}

#### Minimale gegevensverwerking

De PRS bewaart geen persoonsnummer-pseudoniemmapping en neemt geen persoonsnummers of pseudoniemen op in de audit-log. Bij directe pseudonimisering en DigiD SAML-exchange is het persoonsnummer wel tijdelijk aanwezig binnen de vertrouwde PRS-infrastructuur.

{{% /column %}}

{{% column %}}

#### Beheerde toegang

Het ontwerp gebruikt mTLS, OAuth 2.0 en per operatie beheerde bevoegdheden. Langlevend PRS-sleutelmateriaal valt onder een HSM/KMS-regime.

{{% /column %}}

{{% /columns %}}

{{% notice title="Domein is niet hetzelfde als OAuth-scope" %}}

Een domein is een pseudoniemnamespace voor een gebruikstoepassing, terwijl een OAuth-scope een autorisatiebegrip is. Gebruik voor de OPRF-uitwisseling de parameter `recipientScope`.

{{% /notice %}}

{{% /card %}}

{{% anchor id="oauth-token" %}}

{{% card %}}

### OAuth-token voor PRS

PRS heeft een eigen OAuth 2.0 Authorization Service. Gebruik dit endpoint om een token voor de PRS API op te halen. Stuur de vier verplichte formuliervelden `grant_type`, `scope`, `target_audience` en `organization_id` mee. De voorbeelden hieronder gebruiken mTLS en een voorbeeldscope.

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

Gebruik de metadata en JWKS van de OAuth-service van PRS:

`{{% service "oauth.base_path" %}}/.well-known/oauth-authorization-server`\
`{{% service "oauth.base_path" %}}/jwks.json`

{{% /notice %}}

{{% /anchor %}}

{{% card %}}

### Geblindeerde OPRF-uitwisseling {#api-oprf-uitwisseling}

Bij deze gebruiksmogelijkheid gebruikt de PRS een **OPRF-protocol** (Oblivious Pseudo-Random Function) om BSN-nummers om te zetten naar deterministische, onomkeerbare pseudoniemen. Bij de geblindeerde uitwisseling ziet de server nooit het plaintext BSN; de client ziet nooit de serversleutel. Gebruik voor de aanroepen een [Bearer-token](#oauth-token) en mTLS volgens de aansluitinstructies.

{{% /card %}}

{{% card %}}

### Wat is OPRF en waarom drie partijen? {#oprf-uitleg}

OPRF staat voor **Oblivious Pseudo-Random Function**. Het woord "oblivious" is hier essentieel: de server die de berekening uitvoert (de PRS) is zich niet bewust van de invoer (het BSN) en ook niet van de uitvoer (het pseudoniem). Geen van de drie partijen heeft op zichzelf genoeg informatie om de koppeling tussen BSN en pseudoniem te maken.

#### De drie partijen en wat ze weten

| Partij | Weet wel | Weet niet |
| --- | --- | --- |
| Client | Het BSN, de `blind_factor` | De serversleutel, het pseudoniem |
| PRS | De serversleutel, het verblinde getal | Het BSN, het pseudoniem |
| Ontvanger | Het pseudoniem, zijn eigen private key | Het BSN, de serversleutel |

#### Hoe werkt blinding?

Blinding is vergelijkbaar met het versturen van een slot zonder sleutel. De client past een wiskundige vermomming toe op het BSN — de **blind factor** — voordat hij het naar de PRS stuurt. De PRS voert zijn berekening uit op de verblinde waarde en stuurt het resultaat terug. Doordat de PRS de blind factor nooit ziet, kan hij het resultaat niet koppelen aan het originele BSN. De client kan het resultaat vervolgens "ontmaskeren" (unblinden) — maar in dit protocol doet de *ontvanger* dat, niet de client zelf.

#### Waarom kan de client het resultaat niet zien?

De PRS versleutelt het evaluatieresultaat als een **JWE** (JSON Web Encryption) met de publieke sleutel van de ontvanger. Alleen de ontvanger bezit de bijbehorende private key en kan de JWE openen. De client ontvangt de JWE en stuurt die — samen met de `blind_factor` — door naar de ontvanger, maar kan de inhoud zelf niet lezen. Zo weet de client het BSN maar niet het pseudoniem.

#### Waarom is het pseudoniem deterministisch?

De OPRF-functie is deterministisch: dezelfde invoer geeft met dezelfde serversleutel altijd hetzelfde resultaat. Dat maakt het pseudoniem stabiel over meerdere aanvragen. Bovendien wordt het BSN eerst via **HKDF** afgeleid met de ontvanger en scope als context (`org|scope|v1`). Daardoor levert hetzelfde BSN voor elke organisatie en scope een *ander* verbind getal op, en dus een ander pseudoniem — twee organisaties kunnen iemand niet via het pseudoniem koppelen.

{{% notice title="Samenvatting privacygaranties" %}}

- De PRS ziet nooit een plaintext BSN of het definitieve pseudoniem.
- De client ziet nooit de serversleutel of het definitieve pseudoniem.
- De ontvanger ziet nooit het BSN.
- Elke organisatie en scope krijgt een uniek, niet-koppelbaar pseudoniem.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### Algemene OPRF-flow — drie partijen, vier stappen {#oprf-flow}

![OPRF swimlane: Client → PRS → Ontvanger](/assets/img/oprf-flow.svg)

Dit diagram toont de uitwisseling tussen de client, de PRS en de ontvangende dienst. De ontvangende dienst bepaalt hoe de client de uitvoer aanlevert.

{{% steps %}}

{{% step number="1" %}}

#### BSN afschermen — Client

Maak een HKDF-afleiding van het BSN met de ontvanger als context, en blind het resultaat met `pyoprf.blind()`. Bewaar de `blind_factor` lokaal — die is later nodig voor de ontvanger.

Let op: de gebruikte curve voor OPRF is [Ristretto255 / Sha512](https://www.rfc-editor.org/rfc/rfc9497.html#name-oprfristretto255-sha-512).

{{% /step %}}

{{% step number="2" %}}

#### Evaluatie aanvragen — Client → PRS (`POST /oprf/eval`)

Stuur het verblinde getal naar de PRS. De server evalueert het met zijn sleutel en retourneert het resultaat versleuteld als JWE — versleuteld met de *publieke sleutel van de ontvanger*. De client kan de JWE niet ontsleutelen.

{{% /step %}}

{{% step number="3" %}}

#### Doorsturen naar de ontvanger — Client → Ontvanger

Stuur de JWE en de `blind_factor` door naar de ontvangende dienst. Alleen de ontvanger kan de JWE ontsleutelen — hij beschikt over de bijbehorende private key.

{{% /step %}}

{{% step number="4" %}}

#### Ontsleutelen + unblinden — Ontvanger

De ontvanger ontsleutelt de JWE met zijn private key (`jwcrypto`) en combineert de geëvalueerde waarde met de `blind_factor` via `pyoprf.unblind()`. Het resultaat is het definitieve, deterministische pseudoniem.

{{% /step %}}

{{% /steps %}}

{{% /card %}}

{{% notice title="Ontvangerwaarden voor pseudoniem" %}}

Vul onderstaande waarden in voor de ontvangende dienst. `recipientOrganization` is een OIN in de vorm `oin:<20-cijferig-oin>`. De parameternaam `recipientScope` is onderdeel van dit contract; zie hierboven voor het onderscheid tussen een domein en een OAuth-scope.

| Variabele | Waarde |
| --- | --- |
| `RECV_ORG` | `oin:<20-cijferig-oin-ontvanger>` |
| `RECV_SCOPE` | `<ontvanger-scope>` |

{{% /notice %}}

{{% notice title="Deterministisch & organisatie-specifiek" %}}

Hetzelfde BSN levert voor elke combinatie van `recipientOrganization` en `recipientScope` een *ander* pseudoniem op. Twee organisaties kunnen een persoon dus niet op basis van pseudoniem koppelen.

{{% /notice %}}

{{% card %}}

### Stap 1 — BSN afschermen {#bsn-afschermen}

#### 1a. BSN opmaken als JSON

De PRS verwacht geen kale BSN-string als invoer, maar een gestructureerd JSON-object. Gebruik hiervoor een canonieke JSON-representatie conform [RFC 8785 (JSON Canonicalization Scheme)](https://datatracker.ietf.org/doc/html/rfc8785). Als referentie-implementatie kun je bijvoorbeeld [trailofbits/rfc8785.py](https://github.com/trailofbits/rfc8785.py) gebruiken.

```python
import json
import rfc8785

BSN = "999993653"

pid = rfc8785.dumps({
  "landCode": "NL",
  "type": "BSN",
  "value": BSN
}).decode()

# Example using json.dumps(...)
example_json_dumps = json.dumps({"type": "BSN", "value": BSN, "landCode": "NL"}, separators=(",", ":"), sort_keys=True)
```

Verwachte canonieke JSON-uitvoer voor bovenstaande invoer: `{"landCode":"NL","type":"BSN","value":"999993653"}`

#### 1b. HKDF-afleiding — scope-specifieke input genereren

Het JSON-object wordt niet rechtstreeks aan de OPRF-functie aangeboden. Eerst wordt via **HKDF** (HMAC-based Key Derivation Function) een 32-byte waarde afgeleid. De `info`-parameter — opgebouwd als `org|scope|v1` — bindt de afleiding aan een specifieke ontvanger en scope. Hetzelfde BSN levert daardoor voor elke organisatie en scope een *andere* afgeleide waarde op, zodat twee ontvangers het resultaat nooit kunnen koppelen.

```python
info    = f"{RECV_ORG}|{RECV_SCOPE}|v1".encode()
hkdf    = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=info)
derived = hkdf.derive(pid.encode())
```

#### 1c. Blinding — invoer verbergen voor de PRS

De afgeleide waarde wordt geblind met `pyoprf.blind()`. Dit past een willekeurige wiskundige vermomming toe zodat de PRS de werkelijke invoer *nooit* ziet. De functie retourneert twee waarden: de `blind_factor` (geheim, lokaal bewaren — nodig in stap 3) en de `blinded_input` die naar de PRS wordt gestuurd. De `blinded_input` wordt als URL-safe Base64 geëncodeerd voor transport.

```python
blind_factor, blinded_input = pyoprf.blind(derived)
bi_b64 = base64.urlsafe_b64encode(blinded_input).decode()
```

{{% /card %}}

{{% notice title="Beschikbare OPRF-bibliotheken" type="warn" %}}

Niet alle programmeertalen hebben een volwaardige OPRF-implementatie beschikbaar. Bekende bibliotheken:

- **Python** — [`pyoprf`](https://github.com/stef/liboprf/tree/master/python)
- **PHP** — [github.com/jaytaph/oprf-php](https://github.com/jaytaph/oprf-php)

{{% /notice %}}

{{% card %}}

### Stap 2 — Evaluatie aanvragen bij de PRS (`POST /oprf/eval`) {#evaluatie-aanvragen}

Vervang in dit voorbeeld `{{% service "url_placeholder" %}}` door het PRS-serveradres, inclusief `https://` en zonder afsluitende slash.

```python
PRS_BASE_URL = "{{% service "url_placeholder" %}}{{% service "base_path" %}}"

session = requests.Session()
session.cert = ("client-cert.pem", "client-key.pem")

resp = session.post(
    f"{PRS_BASE_URL}/oprf/eval",
    headers={"Authorization": "Bearer <token>"},
    json={
        "encryptedPersonalId":   bi_b64,
        "recipientOrganization": RECV_ORG,
        "recipientScope":        RECV_SCOPE,
    },
)
resp.raise_for_status()
jwe_token = resp.json()["jwe"]  # versleuteld voor de ontvanger — client kan dit NIET lezen
```

{{% /card %}}

{{% card %}}

### Stap 3 — Doorsturen naar de ontvanger {#doorsturen-naar-receiver}

Stuur de ontvangen `jwe_token` samen met de `blind_factor` naar de ontvangende dienst. Gebruik het endpoint en het formaat dat die dienst voorschrijft. De ontvanger ontsleutelt de JWE en gebruikt de blind factor voor het unblinden.

Voor registratie bij de NVI volg je de instructies voor [lokalisatie registreren](/integration/nvi/#lokalisatie-registreren) in de NVI-documentatie.

{{% /card %}}

{{% card %}}

### Ontvanger instellen {#receiver-instellen}

Richt de ontvanger in met de volgende twee stappen voordat je `/oprf/eval` gebruikt:

1. **Organisatie registreren bij de PRS** — laat je organisatie registreren door de beheerder van de betreffende PRS-dienst voordat je verdergaat.
2. **Publieke sleutel registreren** — nadat je organisatie is geregistreerd, voeg je jouw publieke sleutel eenmalig toe via `POST /administration/register/certificate`. De PRS leest de sleutel automatisch uit je PKIoverheid-certificaat.

{{% notice title="Vereiste: organisatie moet eerst geregistreerd zijn" type="warn" %}}

De aanroep naar `/administration/register/certificate` mislukt als jouw organisatie nog niet door een beheerder is toegevoegd. Zorg dat stap 1 is afgerond voordat je stap 2 uitvoert.

{{% /notice %}}

Vervang in dit voorbeeld `{{% service "url_placeholder" %}}` door het PRS-serveradres, inclusief `https://` en zonder afsluitende slash.

```bash
curl -s -X POST \
  --cert client-cert.pem \
  --key client-key.pem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope": ["<scope>"]}' \
  "{{% service "url_placeholder" %}}{{% service "base_path" %}}/administration/register/certificate"
```

`<scope>` is een vrij te kiezen waarde die door de beheerder van de ontvanger wordt bepaald. Deze waarde **moet exact overeenkomen** met de `recipientScope` die later bij `POST /oprf/eval` wordt meegegeven — anders kan de PRS het resultaat niet versleutelen voor de juiste ontvanger.

{{% /card %}}

{{% card %}}

### Stap 4 — Ontsleutelen + unblinden (ontvanger) {#ontsleutelen-unblinden}

De ontvanger ontvangt de `jwe` en `blind_factor` van de Client. Hij ontsleutelt de JWE met zijn private key om het geëvalueerde element te verkrijgen, en past vervolgens de inverse blindingsstap toe om het definitieve pseudoniem te berekenen.

{{% tabs %}}

{{% tab "Python" %}}

Vereiste packages: `pyoprf`, `jwcrypto`

```python
import base64, json
import pyoprf
from jwcrypto import jwe, jwk

RECEIVER_PRIVATE_KEY_PEM = "-----BEGIN PRIVATE KEY-----\n..."

# Ontvangen van de Client
blind_factor = base64.urlsafe_b64decode("<blind_factor_b64>")
jwe_token    = "<jwe-string>"

# Stap 4a — JWE ontsleutelen met de private key van de ontvanger
priv_key = jwk.JWK.from_pem(RECEIVER_PRIVATE_KEY_PEM.encode())
token = jwe.JWE()
token.deserialize(jwe_token)
token.decrypt(priv_key)
payload = json.loads(token.payload)

# Stap 4b — Unblinden → definitief pseudoniem
eval_b64   = payload["subject"].split(":")[-1]
eval_bytes = base64.urlsafe_b64decode(eval_b64)
pseudonym  = base64.urlsafe_b64encode(
    pyoprf.unblind(blind_factor, eval_bytes)
).decode()

print("Pseudoniem:", pseudonym)
```

{{% /tab %}}

{{% tab "PHP" %}}

Vereiste packages: `noxlogic/oprf` (≥ v0.9.1), een JWE-bibliotheek (bijv. `web-token/jwt-framework`)

```php
use Noxlogic\Oprf\OprfClient;

// Ontvangen van de Client
$blind    = '<raw-blind-scalar>';   // binaire string, 32 bytes
$jweToken = '<jwe-string>';

// Stap 4a — JWE ontsleutelen met de private key van de ontvanger
// (gebruik je eigen JWE-bibliotheek; het payload is een JSON-object)
$payload = jweDecrypt($jweToken, $receiverPrivateKey);
$parts   = explode(':', $payload['subject']);
$evaluatedElement = base64_decode(end($parts));

// Stap 4b — Unblinden → definitief pseudoniem
$client    = new OprfClient();
$unblinded = $client->unblind($blind, $evaluatedElement);
$pseudonym = base64_encode($unblinded);

echo "Pseudoniem: $pseudonym\n";
```

{{% /tab %}}

{{% /tabs %}}

{{% /card %}}

{{< page-nav >}}
[← Terug naar overzicht](/integration/) [Volgende: NVI →](/integration/nvi/)
{{< /page-nav >}}

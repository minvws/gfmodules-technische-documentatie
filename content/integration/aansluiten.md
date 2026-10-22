---
title: "Aansluiten"
type: "page"
sections:
  - id: aansluitstappen
    title: "Aansluiten in vier stappen"
  - id: certificaat
    title: "PKIoverheid-certificaat"
    children:
      - id: private-key-beveiligen
        title: "Beveilig je private key"
  - id: registratie
    title: "Organisatie en certificaat registreren"
  - id: verbinding-testen
    title: "Verbinding testen met mTLS"
    children:
      - id: verbinding-curl
        title: "Met curl"
      - id: metadata-healthchecks
        title: "Metadata en healthchecks"
      - id: verbinding-pkcs12
        title: "Met een PKCS#12-bundle"
      - id: pkcs12-aanmaken
        title: "PKCS#12-bundle aanmaken"
aliases:
  - /integration/mtls/
heading: "Aansluiten"
---

Om aan te sluiten op de PRS of NVI heb je een PKIoverheid-clientcertificaat nodig. Hieronder lees je hoe je de aansluiting voorbereidt, je organisatie registreert en de verbinding test.

{{% card %}}

### Aansluiten in vier stappen {#aansluitstappen}

1. [Zorg voor een PKIoverheid-clientcertificaat](#certificaat) met de bijbehorende private key.
2. [Registreer je organisatie en certificaat](#registratie) bij de beheerder van de dienst.
3. [Test de mTLS-verbinding](#verbinding-testen) met de serveradressen.
4. Volg de OAuth-instructies voor [PRS](/integration/prs/#oauth-token) of [NVI](/integration/nvi/#oauth-token) om een token op te halen en de dienst aan te roepen.

{{% /card %}}

{{% card %}}

### PKIoverheid-certificaat {#certificaat}

Vraag een PKIoverheid-certificaat aan dat geschikt is voor clientauthenticatie. Met dit certificaat identificeert je client zich bij de PRS of NVI.

{{% columns %}}

{{% column %}}

#### Wat heb je nodig?

- PKIoverheid-clientcertificaat (`.crt` of `.pem`)
- Bijbehorende private key (`.key`)
- Optioneel: PKCS#12-bundle (`.pfx` of `.p12`)

{{% /column %}}

{{% column %}}

#### Meer informatie

- [Wat is een PKIoverheidcertificaat?](https://www.logius.nl/onze-dienstverlening/toegang/pkioverheid/wat-een-pkioverheidcertificaat)
- [PKIoverheid-combinatiecertificaten voor client- en serverauthenticatie](https://www.logius.nl/onze-dienstverlening/toegang/pkioverheid/pkioverheid-behoudt-combinatiecertificaten-serverauth-en-clientauth)
- [Organisaties die (gratis) testcertificaten aanbieden](https://github.com/pkioverheid/g4-trial#overview)

{{% /column %}}

{{% /columns %}}

{{% notice title="Vereist PKIoverheid-certificaatprofiel" %}}

Type: `G4 Private TLS Generic Devices Organization Validated Server` (`OID 2.16.528.1.1003.1.2.44.15.35.11`). Dit profiel ondersteunt clientauthenticatie (`clientAuth`) en serverauthenticatie (`serverAuth`). De voorbeelden gebruiken het certificaat voor clientauthenticatie bij mTLS.

Organisatie-identificatie: **Organisatie-identificatienummer (OIN)**.

{{% /notice %}}

{{% notice title="Beveilig je private key" type="warn" id="private-key-beveiligen" %}}

Sla de private key nooit op in versiebeheer. Gebruik een secrets-manager (Vault, AWS Secrets Manager, Azure Key Vault) of een OS-sleutelketen.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### Organisatie en certificaat registreren {#registratie}

Registreer je organisatie en het PKIoverheid-clientcertificaat dat je gebruikt vooraf bij de beheerder van de betreffende dienst. Rond deze registratie af voordat je een OAuth-token ophaalt of PRS/NVI aanroept.

{{% /card %}}

{{% card %}}

### Verbinding testen met mTLS {#verbinding-testen}

Bij gewone TLS verifieert alleen de cliënt de server. Bij **Mutual TLS (mTLS)** verifieert ook de server de cliënt aan de hand van een clientcertificaat. Voor de aansluiting gebruik je hiervoor het PKIoverheid-clientcertificaat. Een verbinding zonder geldig clientcertificaat wordt op transportniveau geweigerd.

#### PKIoverheid-certificaat gebruiken

Gebruik voor de mTLS-verbinding je PKIoverheid-clientcertificaat met volledige certificaatketen en de bijbehorende private key. De bestandsnamen hieronder zijn voorbeelden; vervang ze door de paden naar je eigen bestanden:

- `client-cert.pem` — je PKIoverheid-clientcertificaat inclusief de volledige certificaatketen.
- `client-key.pem` — de bijbehorende private key.

#### Verbinding testen met curl {#verbinding-curl}

Test het OAuth-endpoint van de dienst waarmee je wilt verbinden. Vervang de URL-placeholders in de voorbeelden door de serveradressen, inclusief `https://` en zonder afsluitende slash. Gebruik voor de API en de OAuth-service het bijbehorende serveradres.

{{% service-examples "connection-curl" %}}

#### Metadata en healthchecks {#metadata-healthchecks}

De metadata- en health-endpoints hieronder vereisen mTLS. Een OAuth-token is niet nodig. Gebruik je PKIoverheid-clientcertificaat en de bijbehorende private key om de verbinding te testen.

{{% service-examples "connection-metadata" %}}

#### Verbinding testen met een PKCS#12-bundle (`.pfx` / `.p12`) {#verbinding-pkcs12}

{{% service-examples "connection-pkcs12" %}}

#### PKCS#12-bundle aanmaken {#pkcs12-aanmaken}

```bash
openssl pkcs12 -export \
  -in    client-cert.pem \
  -inkey client-key.pem \
  -out   client.p12 \
  -name  "gfmodules-client" \
  -passout pass:geheimwachtwoord
```

{{% /card %}}

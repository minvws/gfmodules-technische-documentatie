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
      - id: verbinding-pkcs12
        title: "Met een PKCS#12-bundle"
      - id: pkcs12-aanmaken
        title: "PKCS#12-bundle aanmaken"
aliases:
  - /integration/mtls/
heading: "Aansluiten"
---

Om aan te sluiten op de PRS of NVI heb je een PKIoverheid-clientcertificaat en een geregistreerde client nodig. Hieronder lees je hoe je de aansluiting voorbereidt, je organisatie en client registreert en de verbinding test.

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

{{% notice title="Certificaatidentiteit" %}}

Gebruik een PKIoverheid-certificaat dat geschikt is voor TLS-clientauthenticatie (`clientAuth`). De aansluiting koppelt het OIN en een domeinnaam uit de Subject Alternative Names (SANs) van het certificaat aan de geregistreerde client.

Organisatie-identificatie: **Organisatie-identificatienummer (OIN)**.

{{% /notice %}}

{{% notice title="Beveilig je private key" type="warn" id="private-key-beveiligen" %}}

Sla de private key nooit op in versiebeheer. Gebruik een secrets-manager (Vault, AWS Secrets Manager, Azure Key Vault) of een OS-sleutelketen.

{{% /notice %}}

{{% /card %}}

{{% card %}}

### Organisatie en certificaat registreren {#registratie}

Registreer je organisatie en client vooraf bij de beheerder van de betreffende dienst. De registratie koppelt de client aan de organisatie waarvoor deze handelt, de handelende organisatie uit het clientcertificaat, de toegestane domeinnamen uit de SANs van het clientcertificaat en de toegestane scopes. Je ontvangt een `client_id` in UUID-formaat. Rond deze registratie af voordat je een OAuth-token ophaalt of PRS/NVI aanroept.

Voor de PRS gebruik je het OIN van 20 posities. Voor de NVI gebruik je de URA van de zorgaanbieder. Registreer voor het beheren en lezen van NVI-registraties ook de bronidentifier (`source_id`). De client kan namens een andere organisatie handelen als die bevoegdheid in de registratie is vastgelegd.

Ontvangt je organisatie PRS-uitvoer, registreer dan ook een aparte publieke ontvangersleutel en de bijbehorende domeinen via het [sleutelbeheer van de PRS](/integration/prs/#receiver-instellen). Deze sleutel versleutelt de JWE voor de ontvanger en staat los van het certificaat waarmee de client de mTLS-verbinding opzet.

{{% /card %}}

{{% card %}}

### Verbinding testen met mTLS {#verbinding-testen}

Bij gewone TLS verifieert alleen de cliënt de server. Bij **Mutual TLS (mTLS)** verifieert ook de server de cliënt aan de hand van een clientcertificaat. Voor de aansluiting gebruik je hiervoor het PKIoverheid-clientcertificaat. Een verbinding zonder geldig clientcertificaat wordt op transportniveau geweigerd.

#### PKIoverheid-certificaat gebruiken

Gebruik voor de mTLS-verbinding je PKIoverheid-clientcertificaat met volledige certificaatketen en de bijbehorende private key. De bestandsnamen hieronder zijn voorbeelden; vervang ze door de paden naar je eigen bestanden:

- `client-cert.pem` — je PKIoverheid-clientcertificaat inclusief de volledige certificaatketen.
- `client-key.pem` — de bijbehorende private key.

#### Verbinding testen met curl {#verbinding-curl}

Test het OAuth-endpoint van de dienst waarmee je wilt verbinden. Vervang de URL-placeholders in de voorbeelden door de basisadressen, inclusief `https://` en een eventuele versieprefix, zonder afsluitende slash. De voorbeelden voegen `/api` of `/oauth` toe. Gebruik voor de API en de OAuth-service het bijbehorende basisadres en de geregistreerde audience.

{{% service-examples "connection-curl" %}}

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

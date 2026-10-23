##### {{ .name }}

```bash
# Controleer de mTLS-verbinding met een PKCS#12-bundle
curl "{{ .url_placeholder }}{{ .base_path }}/health" --cert-type P12 --cert "client.p12:<wachtwoord>"
```

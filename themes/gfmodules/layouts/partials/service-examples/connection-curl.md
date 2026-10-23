{{ with .oauth }}
##### {{ $.name }}

```bash
# Controleer of mTLS-handshake slaagt
curl -v \
  --cert client-cert.pem \
  --key  client-key.pem \
  "{{ .url_placeholder }}{{ .base_path }}/.well-known/oauth-authorization-server"
```
{{ end }}

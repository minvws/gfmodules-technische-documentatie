{{ with .oauth }}
##### {{ $.name }}

- `{{ .base_path }}/.well-known/oauth-authorization-server` — OAuth-servermetadata
- `{{ .base_path }}/health` — health check van de OAuth-service
- `{{ $.base_path }}/health` — health check van de API
{{ end }}

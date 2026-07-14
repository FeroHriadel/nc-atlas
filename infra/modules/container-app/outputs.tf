output "fqdn" {
  description = "The Container App's actual ingress FQDN"
  value       = azurerm_container_app.main.ingress[0].fqdn
}

# Computed from the environment + a locally-known name instead of read off
# azurerm_container_app.main.ingress[0].fqdn, so that consumers of this
# output (aad-auth's SPA redirect URI, blob-storage's CORS origin) don't
# create a dependency cycle back onto this container app — the container app
# itself depends on both of those modules for its AAD client id/secret and
# blob connection string. Azure Container Apps' default (non-custom) FQDN is
# always "<app name>.<environment default domain>", so this predicts the
# exact same value as `fqdn` above, just without the cyclic dependency.
output "predicted_fqdn" {
  value = "${local.app_name}.${azurerm_container_app_environment.main.default_domain}"
}

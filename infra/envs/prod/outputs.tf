output "container_app_fqdn" {
  value = module.container_app.fqdn
}

output "sql_connection_string" {
  value     = module.sql_database.connection_string
  sensitive = true
}

output "aad_tenant_id" {
  value = module.aad_auth.tenant_id
}

output "aad_api_client_id" {
  value = module.aad_auth.api_client_id
}

output "aad_spa_client_id" {
  value = module.aad_auth.spa_client_id
}

output "aad_api_scope" {
  value = module.aad_auth.api_scope
}

output "github_oidc_client_id" {
  value = module.github_oidc.client_id
}

output "github_oidc_tenant_id" {
  value = module.github_oidc.tenant_id
}

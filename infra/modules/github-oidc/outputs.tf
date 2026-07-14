output "client_id" {
  value = azuread_application.deploy.client_id
}

output "tenant_id" {
  value = data.azuread_client_config.current.tenant_id
}

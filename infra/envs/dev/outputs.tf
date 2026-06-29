output "image_storage_account_name" {
  value = module.image_storage.storage_account_name
}

output "image_container_name" {
  value = module.image_storage.container_name
}

output "image_blob_endpoint" {
  value = module.image_storage.primary_blob_endpoint
}

output "image_storage_connection_string" {
  value     = module.image_storage.primary_connection_string
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

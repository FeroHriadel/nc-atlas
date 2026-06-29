output "storage_account_name" {
  value = azurerm_storage_account.images.name
}

output "container_name" {
  value = azurerm_storage_container.images.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.images.primary_blob_endpoint
}

# The API needs this (or the access key below) to mint SAS URLs for uploads.
output "primary_connection_string" {
  value     = azurerm_storage_account.images.primary_connection_string
  sensitive = true
}

output "primary_access_key" {
  value     = azurerm_storage_account.images.primary_access_key
  sensitive = true
}

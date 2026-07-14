resource "azurerm_resource_group" "tfstate" {
  name     = "rg-${var.project_name}-tfstate"
  location = var.location
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "${var.project_name}tfstate"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # State (dev + prod) holds secrets in plaintext (SQL admin password, AAD
  # client secret). This account-level flag closes off anonymous blob reads
  # even if the container's own access_type is ever accidentally changed —
  # defense in depth on top of azurerm_storage_container.tfstate already
  # being "private".
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = true
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

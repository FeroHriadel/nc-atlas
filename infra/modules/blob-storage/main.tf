locals {
  storage_account_name = substr(lower(replace("${var.name_prefix}img", "-", "")), 0, 24)
}

resource "azurerm_storage_account" "images" {
  name                = local.storage_account_name
  resource_group_name = var.resource_group_name
  location            = var.location

  account_tier              = "Standard"
  account_replication_type  = "LRS"
  min_tls_version           = "TLS1_2"

  # Required at the account level before any container can allow anonymous blob reads.
  allow_nested_items_to_be_public = true
}

resource "azurerm_storage_container" "images" {
  name               = var.container_name
  storage_account_id = azurerm_storage_account.images.id

  # "blob" = anonymous read of individual blobs by URL, no container listing,
  # no anonymous writes ever — writes always require the account key or a SAS token.
  container_access_type = "blob"
}

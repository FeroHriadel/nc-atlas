resource "azurerm_resource_group" "main" {
  name     = "rg-ncatlas-dev"
  location = "westeurope"
}

module "image_storage" {
  source = "../../modules/blob-storage"

  name_prefix         = "ncatlas-dev"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

module "aad_auth" {
  source = "../../modules/aad-auth"

  name_prefix       = "ncatlas-dev"
  spa_redirect_uris = ["http://localhost:4200/auth-callback"]
}

# Front Door (Standard SKU, ~$35/mo minimum) intentionally not built yet —
# add a module here when ready for that cost.

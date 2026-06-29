resource "azurerm_resource_group" "main" {
  name     = "rg-ncatlas-dev"
  location = "westeurope"
}

module "function_app" {
  source = "../../modules/function-app"

  name_prefix          = "ncatlas-dev"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  cors_allowed_origins = ["http://localhost:4200"]
}

# Front Door (Standard SKU, ~$35/mo minimum) intentionally not wired up yet —
# see infra/modules/front-door, add it back here when ready for that cost.

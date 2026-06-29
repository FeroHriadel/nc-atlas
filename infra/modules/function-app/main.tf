locals {
  storage_account_name = substr(lower(replace("${var.name_prefix}func", "-", "")), 0, 24)
  function_app_name     = "${var.name_prefix}-api"
}

resource "azurerm_storage_account" "func" {
  name                     = local.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
}

resource "azurerm_service_plan" "func" {
  name                = "${var.name_prefix}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "api" {
  name                = local.function_app_name
  resource_group_name = var.resource_group_name
  location            = var.location

  service_plan_id           = azurerm_service_plan.func.id
  storage_account_name      = azurerm_storage_account.func.name
  storage_account_access_key = azurerm_storage_account.func.primary_access_key

  functions_extension_version = "~4"

  site_config {
    application_stack {
      node_version = var.node_version
    }

    cors {
      allowed_origins = var.cors_allowed_origins
    }
  }
}

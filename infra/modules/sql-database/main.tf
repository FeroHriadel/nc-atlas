resource "random_password" "admin" {
  length = 24
  # SQL Server rejects a handful of special characters in passwords —
  # keep the allowed set narrow to avoid an apply-time login failure.
  override_special = "!#$%&*()-_=+"
}

resource "azurerm_mssql_server" "main" {
  name                = "${var.name_prefix}-sql"
  resource_group_name = var.resource_group_name
  location            = var.location

  version                       = "12.0"
  administrator_login           = var.administrator_login
  administrator_login_password  = random_password.admin.result
  minimum_tls_version           = "1.2"
  public_network_access_enabled = true
}

resource "azurerm_mssql_database" "main" {
  name        = var.database_name
  server_id   = azurerm_mssql_server.main.id
  sku_name    = "Basic"
  max_size_gb = 2
}

# "Allow Azure services" special-case rule (0.0.0.0/0.0.0.0). Broader than the
# name implies — any resource in any Azure subscription can attempt a
# connection, not just this app. Accepted trade-off: Container Apps
# Consumption has no static outbound IP to firewall to more tightly. SQL auth
# is still required to actually get in.
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

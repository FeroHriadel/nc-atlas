resource "azurerm_resource_group" "main" {
  name     = "rg-ncatlas-prod"
  location = "westeurope"
}

module "sql_database" {
  source = "../../modules/sql-database"

  name_prefix         = "ncatlas-prod"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

module "container_app" {
  source = "../../modules/container-app"

  name_prefix = "ncatlas-prod"
  # westeurope has no Container Apps (AKS-backed) capacity available at the
  # time of deploy — swedencentral used instead for just this module. SQL and
  # Blob Storage stay in westeurope (azurerm_resource_group.main.location);
  # Azure resources are located per-resource, not per-resource-group, so this
  # doesn't require moving anything else. Slightly higher DB latency, no
  # functional issue within the EU.
  location            = "swedencentral"
  resource_group_name = azurerm_resource_group.main.name

  connection_string      = module.sql_database.connection_string
  aad_tenant_id          = module.aad_auth.tenant_id
  aad_client_id          = module.aad_auth.api_client_id
  aad_client_secret      = var.prod_azuread_client_secret
  blob_connection_string = module.image_storage.primary_connection_string
  blob_container_name    = module.image_storage.container_name
  claude_api_key         = var.claude_api_key
}

# cors_allowed_origins uses container_app.predicted_fqdn (not .fqdn) — see the
# comment on that output. Using the real .fqdn here would create a dependency
# cycle: this storage account also feeds its own connection string into
# module.container_app above.
module "image_storage" {
  source = "../../modules/blob-storage"

  name_prefix         = "ncatlas-prod"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  # atlas.nclabs.eu added alongside the default *.azurecontainerapps.io
  # domain (not replacing it) — both stay reachable. The custom-domain
  # binding + managed cert itself is applied via `az containerapp hostname
  # bind` outside Terraform (see README) due to open azurerm provider bugs
  # around managed-certificate creation for Container Apps.
  cors_allowed_origins = ["https://${module.container_app.predicted_fqdn}", "https://atlas.nclabs.eu"]
}

# spa_redirect_uris uses container_app.predicted_fqdn for the same
# cycle-avoidance reason (this module's api app feeds module.container_app,
# which would otherwise create a cycle back through the spa app).
module "aad_auth" {
  source = "../../modules/aad-auth"

  name_prefix       = "ncatlas-prod"
  spa_redirect_uris = ["https://${module.container_app.predicted_fqdn}/", "https://atlas.nclabs.eu/"]
}

module "github_oidc" {
  source = "../../modules/github-oidc"

  name_prefix   = "ncatlas-prod"
  github_repo   = "FeroHriadel/nc-atlas"
  role_scope_id = azurerm_resource_group.main.id
}

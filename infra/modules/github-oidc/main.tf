data "azuread_client_config" "current" {}

# Dedicated deploy identity — not reusing the API app registration from
# aad-auth, so this credential's blast radius is limited to "can update the
# Container App" rather than also carrying the API's auth surface.
resource "azuread_application" "deploy" {
  display_name     = "${var.name_prefix}-github-deploy"
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "deploy" {
  client_id = azuread_application.deploy.client_id
}

resource "azuread_application_federated_identity_credential" "main_branch" {
  application_id = azuread_application.deploy.id
  display_name   = "github-actions-main"
  description    = "Allows GitHub Actions on the main branch to authenticate via OIDC (no stored Azure secret)"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_repo}:ref:refs/heads/main"
}

# Least-privilege: "Container Apps Contributor" (not the broad "Contributor"
# role) scoped to the prod resource group only.
resource "azurerm_role_assignment" "container_apps_contributor" {
  scope                = var.role_scope_id
  role_definition_name = "Container Apps Contributor"
  principal_id         = azuread_service_principal.deploy.object_id
}

data "azuread_client_config" "current" {}

resource "random_uuid" "api_scope_id" {}

resource "azuread_application" "api" {
  display_name     = "${var.name_prefix}-api"
  sign_in_audience = "AzureADMyOrg"

  # identifier_uris is managed exclusively by azuread_application_identifier_uri.api
  # below (required to avoid a self-referencing cycle on client_id) — without this,
  # this resource's own plan would fight that one and strip the URI back out.
  lifecycle {
    ignore_changes = [identifier_uris]
  }

  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      id                         = random_uuid.api_scope_id.result
      admin_consent_description  = "Allow the app to access the API on behalf of the signed-in user."
      admin_consent_display_name = "Access API as user"
      user_consent_description   = "Allow the app to access the API on your behalf."
      user_consent_display_name  = "Access API as you"
      value                      = "access_as_user"
      type                       = "User"
      enabled                    = true
    }
  }
}

resource "azuread_application_identifier_uri" "api" {
  application_id = azuread_application.api.id
  identifier_uri = "api://${azuread_application.api.client_id}"
}

resource "azuread_service_principal" "api" {
  client_id = azuread_application.api.client_id
}

# Pre-authorizes the well-known Azure CLI client to request our API scope
# without an interactive consent prompt — for local `az account get-access-token`
# testing only, not something a real client should rely on.
resource "azuread_application_pre_authorized" "azure_cli" {
  application_id       = azuread_application.api.id
  authorized_client_id = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
  permission_ids       = [random_uuid.api_scope_id.result]
}

resource "azuread_application" "spa" {
  display_name     = "${var.name_prefix}-spa"
  sign_in_audience = "AzureADMyOrg"

  single_page_application {
    redirect_uris = var.spa_redirect_uris
  }

  required_resource_access {
    resource_app_id = azuread_application.api.client_id

    resource_access {
      id   = random_uuid.api_scope_id.result
      type = "Scope"
    }
  }
}

resource "azuread_service_principal" "spa" {
  client_id = azuread_application.spa.client_id
}

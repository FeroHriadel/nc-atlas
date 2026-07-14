locals {
  # Defined as a local (not read back off the resource) so outputs.tf's
  # predicted_fqdn can reference it without creating a dependency on
  # azurerm_container_app.main itself — see the comment on that output.
  app_name = "${var.name_prefix}-api"
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.name_prefix}-logs"
  location            = var.location
  resource_group_name = var.resource_group_name

  sku               = "PerGB2018"
  retention_in_days = 30
}

resource "azurerm_container_app_environment" "main" {
  name                       = "${var.name_prefix}-env"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

resource "azurerm_container_app" "main" {
  name                         = local.app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "api"
      image  = var.container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
      env {
        name  = "AzureAd__TenantId"
        value = var.aad_tenant_id
      }
      env {
        name  = "AzureAd__ClientId"
        value = var.aad_client_id
      }
      env {
        name        = "AzureAd__ClientSecret"
        secret_name = "azuread-client-secret"
      }
      env {
        name        = "ConnectionStrings__Default"
        secret_name = "sql-connection-string"
      }
      env {
        name        = "BlobStorage__ConnectionString"
        secret_name = "blob-connection-string"
      }
      env {
        name  = "BlobStorage__ContainerName"
        value = var.blob_container_name
      }
      env {
        name        = "Claude__ApiKey"
        secret_name = "claude-api-key"
      }

      # Unauthenticated, no-DB-dependency endpoint (see Api/Program.cs) — pure
      # liveness/readiness signal so a container that starts but never
      # finishes serving traffic doesn't keep receiving requests.
      liveness_probe {
        transport = "HTTP"
        path      = "/healthz"
        port      = 8080
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/healthz"
        port      = 8080
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "azuread-client-secret"
    value = var.aad_client_secret
  }
  secret {
    name  = "sql-connection-string"
    value = var.connection_string
  }
  secret {
    name  = "blob-connection-string"
    value = var.blob_connection_string
  }
  secret {
    name  = "claude-api-key"
    value = var.claude_api_key
  }

  # CI (`az containerapp update`) owns the running image after the first
  # deploy — without this, every `terraform apply` would fight that and
  # revert prod back to the placeholder image. Widen to the whole `template`
  # block if `terraform plan` ever shows spurious diffs on other container
  # fields.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}

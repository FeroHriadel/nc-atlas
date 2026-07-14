variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-prod\""
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to deploy into"
  type        = string
}

variable "container_image" {
  description = "Full image ref to deploy. Only used on first create — after that, GitHub Actions owns the running image via `az containerapp update` and Terraform ignores drift on this field (see lifecycle.ignore_changes below)."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "connection_string" {
  description = "SQL Server ADO.NET connection string, injected as ConnectionStrings__Default"
  type        = string
  sensitive   = true
}

variable "aad_tenant_id" {
  type = string
}

variable "aad_client_id" {
  type = string
}

variable "aad_client_secret" {
  description = "Client secret for the API app registration, injected as AzureAd__ClientSecret"
  type        = string
  sensitive   = true
}

variable "blob_connection_string" {
  type      = string
  sensitive = true
}

variable "blob_container_name" {
  type = string
}

variable "claude_api_key" {
  type      = string
  sensitive = true
}

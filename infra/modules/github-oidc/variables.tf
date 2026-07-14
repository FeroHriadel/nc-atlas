variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-prod\""
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in \"owner/name\" form, used to scope the OIDC federated credential to that repo's main branch"
  type        = string
}

variable "role_scope_id" {
  description = "Resource ID the Container Apps Contributor role assignment is scoped to (e.g. the prod resource group)"
  type        = string
}

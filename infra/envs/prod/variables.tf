variable "claude_api_key" {
  description = "Anthropic Claude API key (Claude:ApiKey). Set via terraform.tfvars — never committed."
  type        = string
  sensitive   = true
}

variable "prod_azuread_client_secret" {
  description = "Client secret for the prod API app registration (AzureAd:ClientSecret). aad-auth doesn't manage this — create it manually via `az ad app credential reset --id <aad_api_client_id>` after the first apply, then set it via terraform.tfvars and re-apply."
  type        = string
  sensitive   = true
  default     = "placeholder-set-after-first-apply"
}

variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-dev\""
  type        = string
}

variable "spa_redirect_uris" {
  description = "Redirect URIs the SPA app registration accepts after sign-in"
  type        = list(string)
}

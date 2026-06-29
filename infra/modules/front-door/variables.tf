variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-dev\""
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to deploy into"
  type        = string
}

variable "origin_hostname" {
  description = "Hostname of the backend origin (e.g. the Function App's default_hostname)"
  type        = string
}

variable "route_patterns" {
  description = "URL path patterns this route matches"
  type        = list(string)
  default     = ["/api/*"]
}

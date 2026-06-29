variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-dev\""
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

variable "cors_allowed_origins" {
  description = "Origins allowed to call the Function App directly (e.g. the Angular dev server)"
  type        = list(string)
  default     = []
}

variable "node_version" {
  description = "Node.js major version for the Functions runtime"
  type        = string
  default     = "24"
}

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

variable "container_name" {
  description = "Name of the blob container that stores images"
  type        = string
  default     = "images"
}

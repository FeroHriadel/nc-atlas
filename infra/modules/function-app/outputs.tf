output "function_app_name" {
  value = azurerm_linux_function_app.api.name
}

output "default_hostname" {
  value = azurerm_linux_function_app.api.default_hostname
}

output "id" {
  value = azurerm_linux_function_app.api.id
}

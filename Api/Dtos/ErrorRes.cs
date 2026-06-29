namespace Api.Dtos;



public class ErrorRes(string message, int statusCode = 500) : Exception(message)
{
    public string Error => Message;
    public int StatusCode { get; } = statusCode;
}

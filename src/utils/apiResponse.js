class ApiResponse {
  constructor(statuscode, data, message = 'success') {
    this.statusCode = statuscode;
    this.message = message;
    this.data = data;
    this.success = statuscode < 400;
  }
}
export default ApiResponse;

export interface ServerAuthorizationCodeResponse {
  // Success case
  code?: string;
  client_info?: string;
  state?: string;
  cloud_instance_name?: string;
  cloud_instance_host_name?: string;
  cloud_graph_host_name?: string;
  msgraph_host?: string;
  // Error case
  error?: string;
  error_description?: string;
  suberror?: string;
  timestamp?: string;
  trace_id?: string;
  correlation_id?: string;
  claims?: string;
  // Native Account ID
  accountId?: string;
}

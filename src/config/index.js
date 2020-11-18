export const portNumber = 3000;

export const initialiseConfig = () => ({
  deductionsAsid: process.env.GP2GP_ADAPTOR_REPOSITORY_ASID || '200000001161',
  deductionsOdsCode: process.env.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE || 'B86041',
  queueName: process.env.GP2GP_ADAPTOR_MHS_QUEUE_NAME,
  unhandledMessagesQueueName: 'unhandled-raw-inbound',
  queueUrls: [process.env.GP2GP_ADAPTOR_MHS_QUEUE_URL_1, process.env.GP2GP_ADAPTOR_MHS_QUEUE_URL_2],
  queueVirtualHost: process.env.GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST,
  queueUsername: process.env.GP2GP_ADAPTOR_MHS_QUEUE_USERNAME,
  queuePassword: process.env.GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD,
  awsS3BucketName: process.env.GP2GP_ADAPTOR_S3_BUCKET_NAME,
  ehrRepoUrl: process.env.GP2GP_ADAPTOR_EHR_REPO_URL,
  ehrRepoAuthKeys: process.env.GP2GP_ADAPTOR_AUTHORIZATION_KEYS_FOR_EHR_REPO,
  gpToRepoUrl: process.env.GP2GP_ADAPTOR_GP_TO_REPO_URL,
  pdsAsid: process.env.PDS_ASID || '928942012545',
  mhsOutboundUrl: process.env.GP2GP_ADAPTOR_MHS_OUTBOUND_URL,
  mhsRouteUrl: process.env.GP2GP_ADAPTOR_MHS_ROUTE_URL,
  nodeEnv: process.env.NODE_ENV || 'local',
  url: process.env.SERVICE_URL || `http://127.0.0.1:${portNumber}`,
  gpToRepoAuthKeys: process.env.GP2GP_ADAPTOR_AUTHORIZATION_KEYS_FOR_GP_TO_REPO
});

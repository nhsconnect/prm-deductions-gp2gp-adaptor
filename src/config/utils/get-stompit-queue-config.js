import { initialiseConfig } from '../index';
import { generateQueueConfig } from './generate-queue-config';

const formatQueueConfig = queueUrl => {
  const genericQueueConfig = generateQueueConfig(queueUrl);

  return {
    host: genericQueueConfig.host,
    port: genericQueueConfig.port,
    ssl: genericQueueConfig.ssl,
    connectHeaders: {
      login: genericQueueConfig.username,
      passcode: genericQueueConfig.password,
      host: genericQueueConfig.vhost
    }
  };
};

export const getStompitQueueConfig = () => {
  const config = initialiseConfig();

  return config.queueUrls.reduce((stompConfig, queueUrl) => {
    if (queueUrl) stompConfig.push(formatQueueConfig(queueUrl));
    return stompConfig;
  }, []);
};

import httpContext from 'async-local-storage';
import { connect, ConnectFailover } from 'stompit';
import config from '../../../../config';
import logger from '../../../../config/logging';
import handleMessage from '../message-handler';
import { initialiseSubscriber } from '../subscriber';

httpContext.enable();

jest.mock('../../../../config/logging');
jest.mock('../message-handler');

const errorMessage = 'some-error-happened';

const mockTransaction = {
  send: jest.fn(),
  commit: jest.fn(),
  abort: jest.fn()
};

const client = {
  subscribe: jest.fn(),
  begin: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn()
};

const message = { readString: jest.fn(), pipe: jest.fn() };

const originalConfig = { ...config };

const MOCK_QUEUE_NAME = 'mocked-queue-name';

describe('initialiseConsumer', () => {
  afterEach(() => {
    config.queueUrls = originalConfig.queueUrls;
    config.queueUsername = originalConfig.queueUsername;
    config.queuePassword = originalConfig.queuePassword;
    config.queueVirtualHost = originalConfig.queueVirtualHost;
    config.queueName = originalConfig.queueName;
  });

  beforeEach(() => {
    config.queueUrls = ['stomp+ssl://some-url:some-port', 'tcp://other-url:other-port'];
    config.queueUsername = 'some-username';
    config.queuePassword = 'some-password';
    config.queueVirtualHost = '/';
    config.queueName = MOCK_QUEUE_NAME;

    message.readString.mockImplementation((encoding, callback) =>
      callback(null, 'some-message-body')
    );

    client.begin.mockReturnValue(mockTransaction);
    client.subscribe.mockImplementation((config, callback) => callback(null, message));

    connect.mockImplementation(callback => callback(null, client));

    handleMessage.mockResolvedValue();
  });

  it('should connect to the broker with the correct config', async done => {
    await initialiseSubscriber();

    expect(ConnectFailover).toHaveBeenCalledWith(
      [connectionFailoverTemplate(true), connectionFailoverTemplate(false, 'other')],
      { maxReconnects: 1, initialReconnectDelay: 100 }
    );

    done();
  });

  it('should connect to the broker when there is no failover', async done => {
    config.queueUrls = ['stomp+ssl://some-url:some-port'];

    await initialiseSubscriber();

    expect(ConnectFailover).toHaveBeenCalledWith([connectionFailoverTemplate(true)], {
      maxReconnects: 1,
      initialReconnectDelay: 100
    });

    done();
  });

  it('should throw if the queue urls are not configured correctly', () => {
    config.queueUrls[0] = 'some-url-without-protocol:some-port';

    return expect(initialiseSubscriber()).rejects.toEqual(
      Error(
        'Queue url some-url-without-protocol:some-port should have the format protocol://host:port'
      )
    );
  });

  it('should throw when there is an error connecting to the broker', () => {
    connect.mockImplementation(callback => callback(new Error(errorMessage)));

    return expect(initialiseSubscriber()).rejects.toEqual(new Error(errorMessage));
  });

  it('should subscribe to the queue with the correct config', async done => {
    await initialiseSubscriber();

    expect(client.subscribe).toHaveBeenCalledWith(
      { destination: MOCK_QUEUE_NAME, ack: 'client-individual' },
      expect.anything()
    );
    done();
  });

  it('should update the log event when there is an error subscribing to the queue', async done => {
    client.subscribe.mockImplementation((config, callback) =>
      callback(new Error(errorMessage), message)
    );

    await initialiseSubscriber().catch(() => {});

    expect(logger.info).toHaveBeenCalledWith('Event finished', errorMessageTemplate());
    done();
  });

  it('should throw when there is an error subscribing to the queue but no message', async () => {
    client.subscribe.mockImplementation((config, callback) => callback(new Error(errorMessage)));

    return expect(initialiseSubscriber()).rejects.toEqual(Error(errorMessage));
  });

  it('should read the message from the queue with the correct encoding', async done => {
    await initialiseSubscriber();

    expect(message.readString).toHaveBeenCalledWith('UTF-8', expect.anything());
    done();
  });

  it('should update log event when there is an error reading the message', async done => {
    message.readString.mockImplementation((encoding, callback) =>
      callback(new Error(errorMessage), 'some-message-body')
    );

    await initialiseSubscriber().catch(() => {});

    expect(logger.info).toHaveBeenCalledWith('Event finished', errorMessageTemplate());
    done();
  });

  it('should pass the message to the handler', async done => {
    await initialiseSubscriber();
    expect(handleMessage).toHaveBeenCalledWith('some-message-body');
    done();
  });

  it('should acknowledge the message after handling', async done => {
    await initialiseSubscriber();

    setImmediate(() => {
      expect(client.ack).toHaveBeenCalled();
      done();
    });
  });

  it('should log the event after handling', async done => {
    await initialiseSubscriber();

    setImmediate(() => {
      expect(logger.info).toHaveBeenCalledWith('Event finished', {
        event: {
          status: 'Message Handled',
          mhs: {
            mqMessageId: undefined
          }
        }
      });
      done();
    });
  });

  it('should acknowledge the message if handling the message fails (to remove off queue)', async done => {
    handleMessage.mockRejectedValue(new Error(errorMessage));

    await initialiseSubscriber().catch(() => {});

    setImmediate(() => {
      expect(client.ack).toHaveBeenCalled();
      done();
    });
  });

  it('should log the error event if handling the message fails', async done => {
    handleMessage.mockRejectedValue(new Error(errorMessage));

    await initialiseSubscriber().catch(() => {});

    setImmediate(() => {
      expect(logger.info).toHaveBeenCalledWith('Event finished', errorMessageTemplate());
      done();
    });
  });
});

const errorMessageTemplate = () => ({
  event: {
    status: 'Consuming received message',
    error: {
      message: errorMessage,
      stack: expect.any(String)
    }
  }
});

const connectionFailoverTemplate = (isSSL, altPrefix = 'some') => ({
  connectHeaders: {
    login: 'some-username',
    passcode: 'some-password',
    host: '/'
  },
  host: `${altPrefix}-url`,
  port: `${altPrefix}-port`,
  ssl: isSSL
});

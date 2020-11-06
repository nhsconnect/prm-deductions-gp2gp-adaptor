import { initialiseConfig, portNumber } from '../';

const originalEnv = process.env;

describe('config', () => {
  describe('NODE_ENV', () => {
    afterEach(() => {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    });

    it('should get NODE_ENV = local when environment variable not defined', () => {
      if (process.env.NODE_ENV) delete process.env.NODE_ENV;
      expect(initialiseConfig().nodeEnv).toEqual('local');
    });
  });

  describe('url', () => {
    afterEach(() => {
      process.env.SERVICE_URL = originalEnv.SERVICE_URL;
    });

    it('should return 127.0.0.1:3000 when SERVICE_URL is not set', () => {
      if (process.env.SERVICE_URL) delete process.env.SERVICE_URL;
      expect(initialiseConfig().url).toEqual(`http://127.0.0.1:${portNumber}`);
    });
  });

  describe('deductionsAsid', () => {
    afterEach(() => {
      process.env.GP2GP_ADAPTOR_REPOSITORY_ASID = originalEnv.GP2GP_ADAPTOR_REPOSITORY_ASID;
    });

    it('should return 200000001161 when GP2GP_ADAPTOR_REPOSITORY_ASID is not set', () => {
      if (process.env.GP2GP_ADAPTOR_REPOSITORY_ASID) delete process.env.GP2GP_ADAPTOR_REPOSITORY_ASID;
      expect(initialiseConfig().deductionsAsid).toEqual('200000001161');
    });
  });

  describe('deductionsOdsCode', () => {
    afterEach(() => {
      process.env.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE = originalEnv.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE;
    });

    it('should return B86041 when GP2GP_ADAPTOR_REPOSITORY_ODS_CODE is not set', () => {
      if (process.env.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE) delete process.env.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE;
      expect(initialiseConfig().deductionsOdsCode).toEqual('B86041');
    });
  });

  describe('pdsAsid', () => {
    afterEach(() => {
      process.env.PDS_ASID = originalEnv.PDS_ASID;
    });

    it('should return B86041 when PDS_ASID is not set', () => {
      if (process.env.PDS_ASID) delete process.env.PDS_ASID;
      expect(initialiseConfig().pdsAsid).toEqual('928942012545');
    });
  });

  describe('wholesome config test', () => {
    afterEach(() => {
      process.env = originalEnv;
    });

    describe('wholesome config test', () => {
      afterEach(() => {
        process.env = originalEnv;
      });

      it('should map config with process.env values if set', () => {
        process.env.GP2GP_ADAPTOR_REPOSITORY_ASID = 'deductionsAsid';
        process.env.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE = 'deductionsOdsCode';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_NAME = 'queueName';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_URL_1 = 'queueUrl1';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_URL_2 = 'queueUrl2';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST = 'queueVirtualHost';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_USERNAME = 'queueUsername';
        process.env.GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD = 'queuePassword';
        process.env.GP2GP_ADAPTOR_S3_BUCKET_NAME = 'awsS3BucketName';
        process.env.GP2GP_ADAPTOR_EHR_REPO_URL = 'ehrRepoUrl';
        process.env.PDS_ASID = 'pdsAsid';
        process.env.GP2GP_ADAPTOR_MHS_OUTBOUND_URL = 'mhsOutboundUrl';
        process.env.GP2GP_ADAPTOR_MHS_ROUTE_URL = 'mhsRouteUrl';
        process.env.NODE_ENV = 'nodeEnv';
        process.env.SERVICE_URL = 'url';

        expect(initialiseConfig()).toEqual(
          expect.objectContaining({
            deductionsAsid: 'deductionsAsid',
            deductionsOdsCode: 'deductionsOdsCode',
            queueName: 'queueName',
            queueUrls: ['queueUrl1', 'queueUrl2'],
            queueVirtualHost: 'queueVirtualHost',
            queueUsername: 'queueUsername',
            queuePassword: 'queuePassword',
            awsS3BucketName: 'awsS3BucketName',
            ehrRepoUrl: 'ehrRepoUrl',
            pdsAsid: 'pdsAsid',
            mhsOutboundUrl: 'mhsOutboundUrl',
            mhsRouteUrl: 'mhsRouteUrl',
            nodeEnv: 'nodeEnv',
            url: 'url'
          })
        );
      });
    });
  });
});

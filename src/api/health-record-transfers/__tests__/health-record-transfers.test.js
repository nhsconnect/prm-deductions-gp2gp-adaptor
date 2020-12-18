import request from 'supertest';
import app from '../../../app';
import { retrieveEhrFromRepo } from '../../../services/ehr/retrieve-ehr-from-repo';
import { parseMultipartBody } from '../../../services/parser';
import { sendMessage } from '../../../services/mhs/mhs-outbound-client';

jest.mock('../../../services/mhs/mhs-outbound-client');
jest.mock('../../../services/parser');
jest.mock('../../../services/ehr/retrieve-ehr-from-repo');
jest.mock('../../../config', () => ({
  initializeConfig: jest.fn().mockReturnValue({
    gp2gpAdaptorAuthorizationKeys: 'correct-key',
    queueUrls: ['tcp://mq-1:61613', 'tcp://mq-2:61613']
  })
}));

describe('healthRecordTransfers', () => {
  const authKey = 'correct-key';
  const currentEhrUrl = 'fake-url';
  const conversationId = '41291044-8259-4D83-AE2B-93B7BFCABE73';
  const odsCode = 'B1234';
  const mockBody = {
    data: {
      type: 'health-record-transfers',
      id: conversationId,
      attributes: {
        odsCode: odsCode,
        ehrRequestId: '26A541CE-A5AB-4713-99A4-150EC3DA25C6'
      },
      links: {
        currentEhrUrl: currentEhrUrl
      }
    }
  };

  it('should return a 204', async () => {
    const ehrExtract = 'ehr-extract';
    const interactionId = 'RCMR_IN030000UK06';
    const message = 'ehr-message';
    const expectedSendMessageParameters = { interactionId, conversationId, odsCode, message };
    retrieveEhrFromRepo.mockResolvedValue(ehrExtract);
    parseMultipartBody.mockReturnValue([
      { headers: {}, body: 'soap-header' },
      { headers: {}, body: message }
    ]);
    const res = await request(app)
      .post('/health-record-transfers')
      .set('Authorization', authKey)
      .send(mockBody);
    expect(res.status).toBe(204);
    expect(retrieveEhrFromRepo).toHaveBeenCalledWith(currentEhrUrl);
    expect(parseMultipartBody).toHaveBeenCalledWith(ehrExtract);
    expect(sendMessage).toHaveBeenCalledWith(expectedSendMessageParameters);
  });

  describe('validation', () => {
    it('should return correct error message if type is not health-record-transfers', async () => {
      const errorMessage = [{ 'data.type': "Provided value is not 'health-record-transfers'" }];
      const res = await request(app)
        .post('/health-record-transfers')
        .set('Authorization', authKey)
        .send({ data: { ...mockBody.data, type: 'xxx' } });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ errors: errorMessage });
    });

    it('should return correct error message if conversationId is not uuid', async () => {
      const errorMessage = [{ 'data.id': "'conversationId' provided is not of type UUID" }];
      const res = await request(app)
        .post('/health-record-transfers')
        .set('Authorization', authKey)
        .send({ data: { ...mockBody.data, id: 'xxx' } });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ errors: errorMessage });
    });

    it('should return correct error message if odsCode is missing', async () => {
      const errorMessage = [{ 'data.attributes.odsCode': 'Value has not been provided' }];
      const res = await request(app)
        .post('/health-record-transfers')
        .set('Authorization', authKey)
        .send({
          data: { ...mockBody.data, attributes: { ...mockBody.data.attributes, odsCode: '' } }
        });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ errors: errorMessage });
    });

    it('should return correct error message if ehrRequestId is not uuid', async () => {
      const errorMessage = [
        { 'data.attributes.ehrRequestId': 'Provided value is not of type UUID' }
      ];
      const res = await request(app)
        .post('/health-record-transfers')
        .set('Authorization', authKey)
        .send({
          data: {
            ...mockBody.data,
            attributes: { ...mockBody.data.attributes, ehrRequestId: 'xxx' }
          }
        });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ errors: errorMessage });
    });

    it('should return correct error message if currentEhrUrl is not provided', async () => {
      const errorMessage = [{ 'data.links.currentEhrUrl': 'Value has not been provided' }];
      const res = await request(app)
        .post('/health-record-transfers')
        .set('Authorization', authKey)
        .send({
          data: {
            ...mockBody.data,
            links: { ...mockBody.data.links, currentEhrUrl: '' }
          }
        });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ errors: errorMessage });
    });
  });

  describe('authentication', () => {
    it('should return a 401 if Authorization Header is not provided', async () => {
      const res = await request(app).post('/health-record-transfers').send(mockBody);

      expect(res.request.header['Authorization']).toBeUndefined();
      expect(res.statusCode).toBe(401);
    });
  });
});